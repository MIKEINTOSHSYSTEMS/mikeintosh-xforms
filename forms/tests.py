import json
from io import BytesIO
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import Client, RequestFactory, TestCase

from .api import FormSubmissionOut, submit_form
from .models import Form, FormSubmission

User = get_user_model()


class FormCollectionViewTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.collection_url = "/api/forms/"
        self.sample_xls_path = Path(__file__).parent / "static" / "sample_xls_form.xlsx"

    def test_create_form_success(self):
        with open(self.sample_xls_path, "rb") as f:
            xls_file = SimpleUploadedFile(
                "test_form.xlsx",
                f.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )
        
        response = self.client.post(
            self.collection_url,
            data={
                "name": "Household Survey",
                "description": "A basic household-level survey.",
                "xls_file": xls_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Form.objects.count(), 1)

        created_form = Form.objects.get()
        response_data = response.json()

        self.assertEqual(response_data["id"], created_form.pk)
        self.assertEqual(response_data["name"], "Household Survey")
        self.assertIn("<?xml", created_form.xml_definition)  # Check it's XML
        self.assertTrue(created_form.xls_form)  # Check file was saved

    def test_create_form_missing_required_fields(self):
        response = self.client.post(
            self.collection_url,
            data={"description": "Missing both name and file"},
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(Form.objects.count(), 0)

    def test_create_form_missing_file(self):
        response = self.client.post(
            self.collection_url,
            data={
                "name": "Test Form",
                "description": "Missing file",
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("XLS file is required", response.json()["detail"])
        self.assertEqual(Form.objects.count(), 0)

    def test_create_form_invalid_file_extension(self):
        txt_file = SimpleUploadedFile(
            "test.txt",
            b"Not an Excel file",
            content_type="text/plain"
        )
        
        response = self.client.post(
            self.collection_url,
            data={
                "name": "Test Form",
                "xls_file": txt_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Excel file", response.json()["detail"])
        self.assertEqual(Form.objects.count(), 0)

    def test_create_form_duplicate_name_returns_bad_request(self):
        Form.objects.create(name="Duplicate", xml_definition="<data />")

        with open(self.sample_xls_path, "rb") as f:
            xls_file = SimpleUploadedFile(
                "test_form.xlsx",
                f.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            )

        response = self.client.post(
            self.collection_url,
            data={
                "name": "Duplicate",
                "xls_file": xls_file,
            },
            format="multipart",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("already exists", response.json()["detail"])
        self.assertEqual(Form.objects.count(), 1)

    def test_list_forms_returns_existing_records(self):
        Form.objects.create(name="Water", xml_definition="<data id='water'></data>")
        Form.objects.create(name="Health", xml_definition="<data id='health'></data>")

        response = self.client.get(self.collection_url)

        self.assertEqual(response.status_code, 200)
        payload = response.json()

        self.assertIsInstance(payload, list)
        self.assertEqual(len(payload), 2)
        self.assertEqual({item["name"] for item in payload}, {"Water", "Health"})


class FormDetailViewTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(username="formuser", password="pass123")
        self.form = Form.objects.create(
            name="Water Point Inspection",
            description="Baseline inspection form.",
            version="v1",
            xml_definition="<data id='wpi'></data>",
        )
        self.detail_url = f"/api/forms/{self.form.pk}/"

    def test_get_form_detail(self):
        # Create some submissions
        FormSubmission.objects.create(
            form=self.form,
            user=self.user,
            xml_submission="<data><test>1</test></data>"
        )
        FormSubmission.objects.create(
            form=self.form,
            user=None,
            xml_submission="<data><test>2</test></data>"
        )
        
        response = self.client.get(self.detail_url)

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["id"], self.form.pk)
        self.assertEqual(data["name"], self.form.name)
        self.assertEqual(data["xml_definition"], self.form.xml_definition)
        
        # Check submissions are included
        self.assertIn("submissions", data)
        self.assertEqual(len(data["submissions"]), 2)
        self.assertEqual(data["submissions"][0]["username"], None)  # Most recent first (no user)
        self.assertEqual(data["submissions"][1]["username"], "formuser")

    def test_patch_updates_form_fields(self):
        payload = {"description": "Updated description."}
        response = self.client.patch(
            self.detail_url, data=json.dumps(payload), content_type="application/json"
        )

        self.assertEqual(response.status_code, 200)

        self.form.refresh_from_db()
        self.assertEqual(self.form.description, "Updated description.")
        # version remains unchanged because it's not patchable via JSON
        self.assertEqual(self.form.version, "v1")

    def test_patch_rejects_invalid_field_type(self):
        payload = {"description": ["not", "a", "string"]}
        response = self.client.patch(
            self.detail_url, data=json.dumps(payload), content_type="application/json"
        )

        self.assertEqual(response.status_code, 422)
        self.form.refresh_from_db()
        self.assertEqual(self.form.description, "Baseline inspection form.")

    def test_patch_without_mutable_fields_returns_bad_request(self):
        response = self.client.patch(
            self.detail_url, data=json.dumps({}), content_type="application/json"
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("No updatable fields", response.json()["detail"])

    def test_detail_endpoint_rejects_non_supported_method(self):
        response = self.client.post(self.detail_url, data={})
        self.assertEqual(response.status_code, 405)
    
    def test_delete_form(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Form.objects.filter(pk=self.form.pk).exists())
    
    def test_delete_nonexistent_form_returns_not_found(self):
        response = self.client.delete("/api/forms/9999/")
        self.assertEqual(response.status_code, 404)


class FormSubmissionViewTests(TestCase):
    def setUp(self) -> None:
        self.client = Client()
        self.user = User.objects.create_user(username="testuser", password="testpass123")
        self.form = Form.objects.create(
            name="Health Check",
            xml_definition="<data id='health'></data>",
        )
        self.submission_url = f"/api/forms/{self.form.pk}/submissions/"
        self.sample_xml = "<data><result>ok</result></data>"

    def test_submit_form_with_raw_body(self):
        self.client.login(username="testuser", password="testpass123")
        
        response = self.client.post(
            self.submission_url,
            data=self.sample_xml,
            content_type="text/xml; charset=utf-8",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(FormSubmission.objects.count(), 1)

        submission = FormSubmission.objects.get()
        self.assertEqual(submission.form, self.form)
        self.assertEqual(submission.xml_submission, self.sample_xml)
        self.assertEqual(submission.user, self.user)
        
        response_data = response.json()
        self.assertEqual(response_data["username"], "testuser")

    def test_submit_form_falls_back_to_xml_form_field(self):
        factory = RequestFactory()
        request = factory.post(self.submission_url, data={"xml": self.sample_xml})
        request.user = self.user  # Add user to request
        _ = request.POST  # Force parsing so data stays available after overriding body.
        request._body = b"   "

        status_code, payload = submit_form(request, form_id=self.form.pk)

        self.assertEqual(status_code, 201)
        self.assertIsInstance(payload, FormSubmissionOut)
        self.assertEqual(FormSubmission.objects.count(), 1)
        submission = FormSubmission.objects.get()
        self.assertEqual(submission.xml_submission, self.sample_xml)
        self.assertEqual(submission.user, self.user)
        self.assertEqual(payload.form_id, self.form.pk)
        self.assertEqual(payload.submission_id, submission.pk)
        self.assertEqual(payload.username, "testuser")

    def test_submit_form_missing_payload_returns_bad_request(self):
        response = self.client.post(
            self.submission_url,
            data="   ",
            content_type="text/xml; charset=utf-8",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Missing XML", response.json()["detail"])
        self.assertEqual(FormSubmission.objects.count(), 0)

    def test_submission_endpoint_rejects_non_post(self):
        response = self.client.get(self.submission_url)
        self.assertEqual(response.status_code, 405)
    
    def test_submit_form_anonymous_user(self):
        # Don't login, submit as anonymous user
        response = self.client.post(
            self.submission_url,
            data=self.sample_xml,
            content_type="text/xml; charset=utf-8",
        )

        self.assertEqual(response.status_code, 201)
        submission = FormSubmission.objects.get()
        self.assertIsNone(submission.user)
        
        response_data = response.json()
        self.assertIsNone(response_data["username"])
