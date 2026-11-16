# Physics Lab Simulator

A 2D bench simulator for the eight lab experiments, drawn from the actual instruments on the lab benches:

| # | Experiment | Instruments on the bench |
|---|---|---|
| 1 | Hall effect | SES DGM-202 gaussmeter, DHE-21A Hall set-up, DPS-50 constant current supply, EMU-50 electromagnet, probe stand, Ge Hall probe |
| 2 | Newton's rings | INDOSAW SK008 travelling microscope (main scale + 50-div vernier), 45° plate, sodium lamp, plano-convex lens, spherometer, paper + steel scale |
| 3 | Grating spectrometer | Spectrometer with two verniers (1′ LC), prism table + levelling screws, grating (6×10⁵ lines/m), Hg lamp, PHYWE lamp supply |
| 4 | Series LCR | Scientific function generator + BNC–4 mm adapter, PHYWE plug-in board, 1 µF / 24 mH / 10–120 Ω blocks, two DMMs |
| 5 | B-H curve | Universal B-H Curve Tracer (Mittal), coil unit with IC probe, nail / stamping / ferrite, Scientific SM203G CRO |
| 6 | Four-probe | INDOSAW four-probe set-up, oven, PT-100 sensor, p-type Ge |
| 7 | Franck-Hertz | SES FH-3001 with argon tetrode, SM203G CRO for auto mode |
| 8 | Kundt's tube | Scientific function generator, glass tube with speaker, movable microphone rod, PeakTech DMM, steel scale |

Nothing is done for the student: the circuits have to be wired, the switches and knobs set, the lamps warmed up and the optics focused and aligned, and every scale and display read by eye. The observation tables are blank and are filled in by hand.

## Run it

```bash
python3 serve.py
```

Then open http://localhost:8765. Any static file server works; `serve.py` only turns off caching.

## Controls

- Drag the bench to pan, scroll to zoom. The **View** buttons jump to each instrument.
- Knobs: drag or scroll (hold Shift for fine steps). Switches and buttons: click.
- Patch cords: click a socket, then another socket. Click a cord to remove it. The cord colour is picked at the bottom.
- Instrument leads (probe leads, coil leads, BNC cables): click the plug, then a socket.
- Click apparatus (probe stand, lens box, grating box, specimens, oven…) for the actions you can take with it.
- Eyepieces, verniers, the spherometer, scales and the CRO screen open magnified close-up windows.
- **Lab clock** speeds up slow things such as lamp warm-up and oven heating.
- **Different bench** changes the hidden sample, lens and set-up values, so each student gets their own numbers.

Observations are saved in the browser (localStorage). They can be plotted (from your own numbers only) or copied as CSV to paste into a spreadsheet.

## Code layout

- `js/core/` holds the bench (SVG, pan/zoom, sim loop), controls, wiring, UI and the shared instruments (CRO, DMM, function generator, AC circuit solver).
- `js/experiments/` has one file per experiment: drawing, physics, procedure checks and table definitions.
