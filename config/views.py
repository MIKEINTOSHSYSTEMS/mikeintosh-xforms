from django.shortcuts import render


def spa_entrypoint(request):
    """Render the Vue single-page app entry point."""

    return render(request, 'index.html')
