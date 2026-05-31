"""
display.py — Valorius Scraper Live Display
Módulo reutilizable para todos los scrapers de Valorius.
Uso: from display import ScraperDisplay
"""

import time
from collections import Counter
from datetime import datetime

from rich.console import Console
from rich.layout import Layout
from rich.live import Live
from rich.panel import Panel
from rich.progress import BarColumn, MofNCompleteColumn, Progress, TextColumn, TimeElapsedColumn
from rich.table import Table
from rich.text import Text

console = Console()


class ScraperDisplay:
    """
    Display en tiempo real para scrapers de Valorius.

    Uso básico:
        display = ScraperDisplay(nombre="Rentify", fuente="rentify.hn")
        with display.live():
            display.fase("Cargando Supabase")
            display.set_total(38)
            display.fase("Extrayendo propiedades")
            for url in urls:
                display.set_url_actual(url)
                # ... procesar ...
                display.registrar("NUEVO", alertas=["SIN_AREA"])
                display.avanzar()
    """

    COLORES_ESTADO = {
        "NUEVO":             "green",
        "PROBABLE_DUPLICADO": "yellow",
        "REVISAR":           "cyan",
        "DUPLICADO_URL":     "dim",
        "RECHAZADO":         "red",
    }

    def __init__(self, nombre: str, fuente: str):
        self.nombre       = nombre
        self.fuente       = fuente
        self.fase_actual  = "Iniciando..."
        self.url_actual   = ""
        self.total        = 0
        self.procesados   = 0
        self.descartados  = 0
        self.errores      = 0
        self.estados      = Counter()
        self.alertas      = Counter()
        self.inicio       = time.time()
        self._live        = None

        self._progress = Progress(
            TextColumn("[bold cyan]{task.description}"),
            BarColumn(bar_width=35, style="cyan", complete_style="green"),
            MofNCompleteColumn(),
            TextColumn("[green]{task.percentage:>5.1f}%"),
            TimeElapsedColumn(),
            expand=False,
        )
        self._task = self._progress.add_task("Progreso", total=1)

    # ─── Control ─────────────────────────────────────────────────────────────

    def live(self):
        """Context manager para activar el display en vivo."""
        self._live = Live(
            self._render(),
            console=console,
            refresh_per_second=4,
            screen=False,
        )
        return self._live_ctx()

    class _live_ctx:
        def __init__(self): pass
        def __enter__(self): return self
        def __exit__(self, *_): pass

    def _start(self):
        if self._live:
            self._live.start()

    def _stop(self):
        if self._live:
            self._live.stop()

    # ─── Actualizadores ──────────────────────────────────────────────────────

    def fase(self, texto: str):
        self.fase_actual = texto
        self._refresh()

    def set_total(self, n: int):
        self.total = n
        self._progress.update(self._task, total=n)
        self._refresh()

    def set_url_actual(self, url: str):
        self.url_actual = url
        self._refresh()

    def avanzar(self):
        self.procesados += 1
        self._progress.update(self._task, completed=self.procesados)
        self._refresh()

    def registrar(self, estado: str, alertas: list = None):
        self.estados[estado] += 1
        for a in (alertas or []):
            self.alertas[a] += 1
        self._refresh()

    def descartar(self):
        self.descartados += 1
        self._refresh()

    def error(self):
        self.errores += 1
        self._refresh()

    # ─── Render ──────────────────────────────────────────────────────────────

    def _refresh(self):
        if self._live:
            self._live.update(self._render())

    def _render(self) -> Panel:
        elapsed = int(time.time() - self.inicio)
        h, m, s = elapsed // 3600, (elapsed % 3600) // 60, elapsed % 60
        ahora   = datetime.now().strftime("%H:%M:%S")

        layout = Layout()
        layout.split_column(
            Layout(name="header",   size=3),
            Layout(name="fase",     size=3),
            Layout(name="progress", size=3),
            Layout(name="url",      size=3),
            Layout(name="stats",    size=10),
            Layout(name="footer",   size=3),
        )

        # Header
        header_txt = Text(justify="center")
        header_txt.append(f"  VALORIUS SCRAPER", style="bold white")
        header_txt.append(f" — {self.nombre}", style="bold cyan")
        header_txt.append(f"  ·  {self.fuente}", style="dim")
        header_txt.append(f"  ·  {ahora}", style="dim")
        layout["header"].update(Panel(header_txt, style="bold blue"))

        # Fase
        layout["fase"].update(
            Panel(Text(f"  Fase: {self.fase_actual}", style="yellow"), style="blue")
        )

        # Barra de progreso
        layout["progress"].update(
            Panel(self._progress, style="blue")
        )

        # URL actual
        url_short = self.url_actual[-90:] if len(self.url_actual) > 90 else self.url_actual
        layout["url"].update(
            Panel(Text(f"  {url_short}", style="dim white", overflow="fold"), style="blue")
        )

        # Stats: tabla doble (estados | alertas)
        stats_layout = Layout()
        stats_layout.split_row(
            Layout(name="estados"),
            Layout(name="alertas"),
        )

        t_estados = Table(show_header=True, box=None, padding=(0, 2))
        t_estados.add_column("Estado", style="bold")
        t_estados.add_column("N", justify="right")
        for estado in ["NUEVO", "PROBABLE_DUPLICADO", "REVISAR", "DUPLICADO_URL", "RECHAZADO"]:
            n = self.estados.get(estado, 0)
            if n > 0:
                color = self.COLORES_ESTADO.get(estado, "white")
                t_estados.add_row(Text(estado, style=color), str(n))
        stats_layout["estados"].update(Panel(t_estados, title="Resultados", style="blue"))

        t_alertas = Table(show_header=True, box=None, padding=(0, 2))
        t_alertas.add_column("Alerta", style="bold")
        t_alertas.add_column("N", justify="right")
        for alerta, n in self.alertas.most_common(6):
            t_alertas.add_row(Text(alerta, style="yellow"), str(n))
        stats_layout["alertas"].update(Panel(t_alertas, title="Alertas", style="blue"))

        layout["stats"].update(stats_layout)

        # Footer
        footer_txt = Text(justify="center")
        footer_txt.append(f"  Descartados: {self.descartados}", style="dim")
        footer_txt.append(f"  |  Errores: {self.errores}", style="red" if self.errores else "dim")
        footer_txt.append(f"  |  Tiempo: {h:02d}:{m:02d}:{s:02d}", style="dim")
        layout["footer"].update(Panel(footer_txt, style="blue"))

        return Panel(layout, title=f"[bold cyan]Valorius Market Intelligence[/]", border_style="blue")

    # ─── Resumen final ───────────────────────────────────────────────────────

    def resumen(self):
        """Imprime resumen final después de cerrar el live display."""
        console.print()
        console.rule("[bold cyan]Resumen final[/]")
        console.print(f"  [bold]Total procesados:[/] {self.procesados}")
        console.print(f"  [bold]Descartados:[/]      {self.descartados}")
        console.print(f"  [bold]Errores:[/]          {self.errores}")
        console.print()
        for estado, n in sorted(self.estados.items()):
            color = self.COLORES_ESTADO.get(estado, "white")
            console.print(f"  [{color}]{estado:<22}[/] {n}")
        if self.alertas:
            console.print()
            for alerta, n in self.alertas.most_common():
                console.print(f"  [yellow]{alerta:<22}[/] {n}")
        console.rule()
