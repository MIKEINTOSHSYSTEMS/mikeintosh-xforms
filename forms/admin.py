from django.contrib import admin

from .models import Form, FormSubmission


@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ("name", "version", "updated_at")
    search_fields = ("name", "description", "version")
    readonly_fields = ("created_at", "updated_at")


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("form", "submitted_at", "pk")
    list_filter = ("form",)
    search_fields = ("xml_submission",)
    raw_id_fields = ("form",)
    readonly_fields = ("submitted_at",)
