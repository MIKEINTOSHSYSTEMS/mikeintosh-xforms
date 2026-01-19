from __future__ import annotations

from datetime import datetime
import os
import tempfile
import traceback

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str
from ninja import Field, ModelSchema, Router, Schema
from ninja.errors import HttpError
from ninja.files import UploadedFile

# Try to import pyxform
try:
    from pyxform.xls2xform import xls2xform_convert
    PYXFORM_AVAILABLE = True
except ImportError as e:
    PYXFORM_AVAILABLE = False
    print(f"Warning: pyxform not available. Error: {e}")

from .models import Form, FormSubmission


router = Router(tags=["forms"])


class FormOut(ModelSchema):
    class Meta:
        model = Form
        fields = [
            "id",
            "name",
            "description",
            "xls_form",
            "version",
            "xml_definition",
            "created_at",
            "updated_at",
        ]


class FormSubmissionOut(Schema):
    submission_id: int
    form_id: int
    submitted_at: datetime
    username: str | None = None
    xml_submission: str


class FormDetailOut(Schema):
    id: int
    name: str
    description: str
    xls_form: str | None = None
    version: str
    xml_definition: str
    created_at: datetime
    updated_at: datetime
    submissions: list[FormSubmissionOut] = []


class FormCreatePayload(Schema):
    name: str = Field(..., min_length=1)
    description: str | None = None


class FormUpdatePayload(Schema):
    name: str | None = Field(default=None, min_length=1)
    description: str | None = None


class XLSPlayPreviewOut(Schema):
    xml_definition: str
    version: str
    form_name: str


def _assert_unique_name(name: str, *, exclude_id: int | None = None) -> None:
    existing = Form.objects.all()
    if exclude_id is not None:
        existing = existing.exclude(pk=exclude_id)
    if existing.filter(name=name).exists():
        raise HttpError(400, "A form with this name already exists.")


def _extract_xml_payload(request) -> str:
    xml_payload = force_str(request.body, encoding=request.encoding or "utf-8").strip()

    if not xml_payload:
        xml_payload = request.POST.get("xml", "").strip()

    if not xml_payload:
        raise HttpError(400, "Missing XML submission payload.")

    return xml_payload


def _validate_and_convert_xls(xls_file):
    """Validate uploaded file looks like Excel and convert to XForm using pyxform.

    Returns: (xml_definition: str, version: str, form_name: str)
    Raises HttpError on invalid input or conversion errors.
    """
    if not PYXFORM_AVAILABLE:
        raise HttpError(500, "pyxform is not available. Please install it with: pip install pyxform")
    
    if not xls_file.name.lower().endswith(('.xlsx', '.xls')):
        raise HttpError(400, "File must be an Excel file (.xlsx or .xls)")

    try:
        # Reset file pointer
        xls_file.seek(0)
        
        # Get the original file name
        form_name = os.path.splitext(xls_file.name)[0]
        
        # Create temp files for input and output
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False, mode='wb') as tmp_xls_file:
            tmp_xls_file.write(xls_file.read())
            xls_path = tmp_xls_file.name
        
        # Create temp file for XML output
        with tempfile.NamedTemporaryFile(suffix='.xml', delete=False, mode='w', encoding='utf-8') as tmp_xml_file:
            xml_path = tmp_xml_file.name
        
        try:
            # Convert using pyxform - it writes to the output file
            # The function returns a list of warnings, but we don't need them for now
            warnings = xls2xform_convert(
                xlsform_path=xls_path,
                xform_path=xml_path,
                validate=False,
                pretty_print=True,
                enketo=False
            )
            
            # Read the generated XML file
            with open(xml_path, 'r', encoding='utf-8') as f:
                xml_definition = f.read()
            
            # Try to extract version from XML
            version = ""
            # Look for version attribute in the XML
            import re
            version_match = re.search(r'version="([^"]+)"', xml_definition)
            if version_match:
                version = version_match.group(1)
            
            return xml_definition, version, form_name
            
        except Exception as inner_exc:
            # Provide more detailed error
            error_details = traceback.format_exc()
            print(f"Pyxform conversion error: {error_details}")
            raise HttpError(400, f"XLSForm conversion failed: {str(inner_exc)}") from inner_exc
        finally:
            # Clean up temp files
            for path in [xls_path, xml_path]:
                if os.path.exists(path):
                    os.unlink(path)
        
    except Exception as exc:
        error_msg = str(exc)
        print(f"Overall conversion error: {traceback.format_exc()}")
        
        # Provide more helpful error message
        if "No module named" in error_msg or "cannot import name" in error_msg:
            error_msg = "pyxform is not properly installed. Please install it with: pip install pyxform"
        
        raise HttpError(400, f"Failed to convert XLSForm: {error_msg}") from exc


def _save_xls_file(form: Form, xls_file) -> None:
    """Save uploaded xls_file to the form's FileField (ensures pointer reset)."""
    xls_file.seek(0)
    form.xls_form.save(xls_file.name, xls_file, save=True)


@router.get("/", response=list[FormOut])
def list_forms(request):
    return list(Form.objects.order_by("name"))


@router.post("/", response={201: FormOut})
def create_form(request):
    # Extract form data
    name = request.POST.get('name', '').strip()
    description = request.POST.get('description', '').strip()
    
    if not name:
        raise HttpError(400, "Form name is required")
    
    _assert_unique_name(name)

    # Check if file was uploaded
    if 'xls_file' not in request.FILES:
        raise HttpError(400, "XLS file is required")
    
    xls_file = request.FILES['xls_file']
    
    xml_definition, version, _ = _validate_and_convert_xls(xls_file)

    try:
        form = Form.objects.create(
            name=name,
            description=description,
            xml_definition=xml_definition,
            version=version,
        )
        _save_xls_file(form, xls_file)
    except IntegrityError as exc:
        raise HttpError(400, "A form with this name already exists.") from exc

    return 201, form


@router.post("/preview/", response=XLSPlayPreviewOut)
def preview_xlsform(request, file: UploadedFile):
    """Preview endpoint for XLSPlay - converts XLSForm to XML without saving to database."""
    xml_definition, version, form_name = _validate_and_convert_xls(file)
    
    # Return the XML definition and other info
    return XLSPlayPreviewOut(
        xml_definition=xml_definition,
        version=version,
        form_name=form_name
    )


@router.get("/{form_id}/", response=FormDetailOut)
def get_form(request, form_id: int):
    form = get_object_or_404(Form, pk=form_id)
    submissions = list(form.submissions.order_by("-submitted_at")[:10])
    
    return FormDetailOut(
        id=form.pk,
        name=form.name,
        description=form.description,
        xls_form=form.xls_form.name if form.xls_form else None,
        version=form.version,
        xml_definition=form.xml_definition,
        created_at=form.created_at,
        updated_at=form.updated_at,
        submissions=[
            FormSubmissionOut(
                submission_id=sub.pk,
                form_id=form.pk,
                submitted_at=sub.submitted_at,
                username=sub.user.username if sub.user else None,
                xml_submission=sub.xml_submission,
            )
            for sub in submissions
        ],
    )


@router.patch("/{form_id}/", response=FormOut)
def update_form(request, form_id: int, payload: FormUpdatePayload):
    form = get_object_or_404(Form, pk=form_id)

    if 'xls_file' in request.FILES:
        xls_file = request.FILES['xls_file']
        xml_definition, version, _ = _validate_and_convert_xls(xls_file)

        if payload.model_fields_set and 'name' in payload.model_fields_set:
            name_val = getattr(payload, 'name')
            if name_val is None:
                raise HttpError(400, "The 'name' field must be a string.")
            _assert_unique_name(name_val, exclude_id=form.pk)
            form.name = name_val

        if payload.model_fields_set and 'description' in payload.model_fields_set:
            desc_val = getattr(payload, 'description')
            if desc_val is None:
                raise HttpError(400, "The 'description' field must be a string.")
            form.description = desc_val

        form.xml_definition = xml_definition
        if version:
            form.version = version

        try:
            form.save()
            _save_xls_file(form, xls_file)
        except IntegrityError as exc:
            raise HttpError(400, "A form with this name already exists.") from exc

        return form

    if not payload.model_fields_set:
        raise HttpError(400, "No updatable fields provided.")

    updates: dict[str, str] = {}
    for field_name in payload.model_fields_set:
        value = getattr(payload, field_name)
        if value is None:
            raise HttpError(400, f"The '{field_name}' field must be a string.")
        updates[field_name] = value

    if "name" in updates:
        _assert_unique_name(updates["name"], exclude_id=form.pk)

    for field_name, value in updates.items():
        setattr(form, field_name, value)

    try:
        form.save()
    except IntegrityError as exc:
        raise HttpError(400, "A form with this name already exists.") from exc

    return form


@router.delete("/{form_id}/", response={204: None})
def delete_form(request, form_id: int):
    form = get_object_or_404(Form, pk=form_id)
    form.delete()
    return 204


@router.post("/{form_id}/submissions/", response={201: FormSubmissionOut})
def submit_form(request, form_id: int):
    form = get_object_or_404(Form, pk=form_id)
    xml_payload = _extract_xml_payload(request)

    submission = FormSubmission.objects.create(
        form=form,
        user=request.user if request.user.is_authenticated else None,
        xml_submission=xml_payload,
    )

    return 201, FormSubmissionOut(
        submission_id=submission.pk,
        form_id=form.pk,
        submitted_at=submission.submitted_at,
        username=submission.user.username if submission.user else None,
        xml_submission=submission.xml_submission,
    )