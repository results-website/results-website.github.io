# Visible future object motion

The site audits all 1,200 validation episodes at K=4. The coverage table includes every expected episode, including pending, failed, and zero-candidate episodes.

Only frames with both object and robot points, >=2 cm actual movement and >=6 visible native pixels, and >=2 cm / >=6 pixels of predicted movement of the same object point enter the candidate gallery. Actual future playback and predicted trajectories are shown separately.

Trajectory difference compares time-aligned 2D displacements after aligning each point at its own starting position. The new defaults require all four points to move, ours to succeed where a baseline fails, and all six pairs to differ by >=3 native pixels RMS in both actual motion and the forecast. Rank by the minimum robot-object pair difference, with all-pairs and nearest-at-start alternatives. Thresholds and actual/forecast scoring are adjustable. Pair tables, aligned motion plots, and trajectory_diversity.csv expose the scores.


## Midterm review workspace

`midterm/` is a buildless browser application for reviewing an instructor-supplied private grading file. The public repository contains the application only. Student identities, scans, answers, keys, and grades are loaded from the private file and saved locally in IndexedDB; the application makes no data uploads. Corrections and timestamped history can be downloaded as a backup and restored on another computer after opening the same private file. Exports include grades, corrections compatible with the grading script, and exam/item analysis. All 21 questions, including Q15, enter the statistics.
