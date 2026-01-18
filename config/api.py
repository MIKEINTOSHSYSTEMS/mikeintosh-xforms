from ninja import NinjaAPI

from forms.api import router as forms_router


# Single Ninja API instance used for all project endpoints.
api = NinjaAPI(csrf=False)

api.add_router("/forms", forms_router)
