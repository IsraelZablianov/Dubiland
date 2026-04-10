-- Runtime metadata + quality gate contract for prioritized handbook reading ladder slots.
-- Source: DUB-392
--
-- Applies to existing interactive handbook level config without schema changes.

UPDATE public.game_levels AS gl
SET config_json = COALESCE(gl.config_json, '{}'::jsonb) || '{
  "readingLadder": {
    "activeBook": "book4",
    "orderedBookIds": ["book1", "book4", "book7"],
    "books": {
      "book1": {
        "ageBand": "3-4",
        "handbookSlug": "mikaSoundGarden",
        "checkpointFocus": "print_awareness"
      },
      "book4": {
        "ageBand": "5-6",
        "handbookSlug": "yoavLetterMap",
        "checkpointFocus": "letter_nikud_cv_decoding"
      },
      "book7": {
        "ageBand": "6-7",
        "handbookSlug": "tamarWordTower",
        "checkpointFocus": "phrase_fluency_comprehension"
      }
    },
    "qualityGate": {
      "firstTryAccuracyMin": 70,
      "hintRateMax": 35
    }
  }
}'::jsonb
FROM public.games AS g
WHERE g.id = gl.game_id
  AND g.slug = 'interactiveHandbook'
  AND gl.level_number = 1;
