from django.conf import settings
from django.db import models


class Form(models.Model):
    """Stores a single form definition as XML."""

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    xls_form = models.FileField(upload_to="xlsforms/", blank=True, null=True)
    xml_definition = models.TextField()
    version = models.CharField(max_length=64, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class FormSubmission(models.Model):
    """Stores an XML submission for a particular form."""

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="submissions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    xml_submission = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-submitted_at"]

    def __str__(self) -> str:
        return f"{self.form.name} submission {self.pk}"
