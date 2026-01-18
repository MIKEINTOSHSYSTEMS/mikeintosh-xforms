from __future__ import annotations

from datetime import datetime

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from django.utils.encoding import force_str
from ninja import Field, ModelSchema, Router, Schema
from ninja.errors import HttpError
from pyxform.xls2xform import convert

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
    # version and xml_definition are managed via XLS uploads and are not
    # directly patchable via this payload.


class FormSubmissionOut(Schema):
    submission_id: int
    form_id: int
    submitted_at: datetime
    username: str | None = None
    xml_submission: str


def _assert_unique_name(name: str, *, exclude_id: int | None = None) -> None:
    existing = Form.objects.all()
    if exclude_id is not None:
        existing = existing.exclude(pk=exclude_id)
    if existing.filter(name=name).exists():
        raise HttpError(400, "A form with this name already exists.")


def _normalize_string(value: str | None, *, default: str = "") -> str:
    if value is None:
        return default
    if not isinstance(value, str):
        raise HttpError(400, "Provided value must be a string.")
    return value


def _extract_xml_payload(request) -> str:
    xml_payload = force_str(request.body, encoding=request.encoding or "utf-8").strip()

    if not xml_payload:
        xml_payload = request.POST.get("xml", "").strip()

    if not xml_payload:
        raise HttpError(400, "Missing XML submission payload.")

    return xml_payload


def _validate_and_convert_xls(xls_file):
    """Validate uploaded file looks like Excel and convert to XForm using pyxform.

    Returns: (xml_definition: str, version: str)
    Raises HttpError on invalid input or conversion errors.
    """
    if not xls_file.name.endswith(('.xlsx', '.xls')):
        raise HttpError(400, "File must be an Excel file (.xlsx or .xls)")

    try:
        xls_file.seek(0)
        result = convert(
            xlsform=xls_file.read(),
            validate=False,
            pretty_print=True,
        )
    except Exception as exc:  # pragma: no cover - conversion can raise many things
        raise HttpError(400, f"Failed to convert XLSForm: {force_str(exc)}") from exc

    xml_definition = result.xform
    version = ""
    pyx = getattr(result, "_pyxform", None)
    if isinstance(pyx, dict) and "version" in pyx:
        version = str(pyx["version"])

    return xml_definition, version


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
    
    # Validate file extension
    if not xls_file.name.endswith(('.xlsx', '.xls')):
        raise HttpError(400, "File must be an Excel file (.xlsx or .xls)")

    xml_definition, version = _validate_and_convert_xls(xls_file)

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

    # If a file was uploaded, prefer processing it (like create_form)
    # Support multipart/form-data where files live in request.FILES
    if 'xls_file' in request.FILES:
        xls_file = request.FILES['xls_file']

        xml_definition, version = _validate_and_convert_xls(xls_file)

        # Update model fields
        if payload.model_fields_set and 'name' in payload.model_fields_set:
            name_val = getattr(payload, 'name')
            if name_val is None:
                raise HttpError(400, "The 'name' field must be a string.")
            _assert_unique_name(name_val, exclude_id=form.pk)
            form.name = name_val

        # Optional description update from payload
        if payload.model_fields_set and 'description' in payload.model_fields_set:
            desc_val = getattr(payload, 'description')
            if desc_val is None:
                raise HttpError(400, "The 'description' field must be a string.")
            form.description = desc_val

        # Apply xform changes
        form.xml_definition = xml_definition
        if version:
            form.version = version

        try:
            # Save model first to ensure we have an instance for FileField.save
            form.save()
            _save_xls_file(form, xls_file)
        except IntegrityError as exc:  # pragma: no cover - defensive duplicate guard
            raise HttpError(400, "A form with this name already exists.") from exc

        return form

    # No file uploaded - fallback to JSON patch behavior (partial update)
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
    except IntegrityError as exc:  # pragma: no cover - defensive duplicate guard
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
