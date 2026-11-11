# Visible future object motion

The site audits all 1,200 validation episodes at K=4. The coverage table includes every expected episode, including pending, failed, and zero-candidate episodes.

Only frames with both object and robot points, >=2 cm actual movement and >=6 visible native pixels, and >=2 cm / >=6 pixels of predicted movement of the same object point enter the candidate gallery. Actual future playback and predicted trajectories are shown separately.

Trajectory difference compares time-aligned 2D displacements after aligning each point at its own starting position. The new defaults require all four points to move, ours to succeed where a baseline fails, and all six pairs to differ by >=3 native pixels RMS in both actual motion and the forecast. Rank by the minimum robot-object pair difference, with all-pairs and nearest-at-start alternatives. Thresholds and actual/forecast scoring are adjustable. Pair tables, aligned motion plots, and trajectory_diversity.csv expose the scores.


## Midterm review workspace

`midterm/` is a buildless browser application for reviewing an instructor-supplied private grading file. The site loads the prepared default exam automatically at the ordinary /midterm/ address. Its packaged data and loading configuration are available to site visitors, as requested by the instructor. Previously saved corrections are preserved, and subsequent visits restore the local dataset without another download. Corrections are not uploaded; alternate private review files can still be opened manually. Corrections and timestamped history can be downloaded as a backup and restored on another computer after opening the same private file. Exports include grades, corrections compatible with the grading script, and exam/item analysis. All 21 questions, including Q15, enter the statistics.


## Updated professor report

`midterm/stats/` is a read-only snapshot built from the instructor’s updated Numbers file. All 167 resolved answer scores are included; identity and extra-mark flags do not withhold scores, per instructor instruction. All 21 questions, including Q15, enter the analysis. The report offers searchable grades, per-student answer results, score distributions, item statistics, version/topic comparisons, CSV exports, and a standalone offline HTML copy. It has no editing or browser-storage writes.

The updated report also reconciles exams one-to-one with the official 174-student roster: 166 matched exams, one instructor-confirmed auditor, and eight roster records without an exam. Official names and SIS IDs replace transcriptions only for matched records. Every original exam score is preserved, including the auditor’s score in all statistics. Dedicated matched-grade, full-roster, and match-audit CSVs are available from the Roster matching tab.
