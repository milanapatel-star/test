# Festival dates: second check (13 October 2026)

The ten festival dates loaded into Toran (`supabase/migrations/
20261012110100_festival_dates.sql` in Toran-Main-Code) were checked against
what UK and Indian festival sites say, using web search only. **Every date
matches the majority of sources.** None is marked "checked" on the site
yet: that should follow a look at a London panchang (Drik Panchang with
London selected, or a mandir's printed calendar). Do it on `/ops` →
Festival dates, entering the source.

| Festival            | Toran's date            | What sources say                                                                                     | Confidence |
| ------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------- | ---------- |
| Navratri            | Sun 11 – Mon 19 Oct 2026 | Same (Ghatasthapana 11 Oct; Ashtami 18 Oct; Navami 19 Oct) [1]                                        | Good       |
| Dussehra            | Tue 20 Oct 2026         | Same for London; Vijay Muhurat 2:29–3:10pm BST [1]                                                    | Good       |
| Dhanteras           | Fri 6 Nov 2026          | Same [2][3]                                                                                           | Good       |
| Diwali (Lakshmi Puja) | Sun 8 Nov 2026        | Same; one source gives a London puja window of 4:35–6:12pm [2][3]                                     | Good       |
| Annakut / New Year (Gujarati) | **Tue 10 Nov 2026** | Govardhan Puja/Annakut 9 Nov in UK sources [2][3]; Drik Panchang (London) and Bestu Varas sources say 10 Nov | **Decided** (16 Oct) |
| Bhai Dooj           | Tue 10 Nov 2026         | UK sources say 10 Nov [2][3]; Wikipedia and one Indian site say 11 Nov (Indian time)                  | **Check**  |
| Maha Shivaratri     | Sat 6 Mar 2027          | Most say 6 Mar, one London-specific [4]; two outliers (5 Mar, 5 Apr)                                  | Good       |
| Holi                | Mon 22 Mar 2027         | Same; Holika Dahan Sun 21 Mar [5]                                                                     | Good       |
| Navratri            | Thu 30 Sep – Fri 8 Oct 2027 | Same start; Ashtami 7 Oct, Navami 8 Oct (India times; UK could shift a day) [6]                   | Fair       |
| Dussehra            | Sat 9 Oct 2027          | Same (India and US); no London source found [6]                                                       | Fair       |

**Worth knowing:** Bhaktivedanta Manor's Dussehra festival is on Sunday
25 October 2026, not on the day itself [1]. Mandirs often hold celebrations
at the weekend, which is why Toran lists the festival date and each mandir
lists its own event.

## Sources

1. [Dussehra 2026 in London (Hindutone)](https://hindutone.com/festivals/navratri/dussehra-2026-london/);
   [Navratri 2026 in the UK, city by city (Hindutone)](https://hindutone.com/festivals/navratri-2026-uk-city-by-city-garba-dandiya-durga-puja/)
2. [Diwali 2026 dates UK: 5-day guide (Hindutone)](https://hindutone.com/festivals/diwali-2026/diwali-2026-dates-uk-complete-5-day-celebration/)
3. [Diwali 2026: the date, and why your city's time differs (Shaadi News)](https://shaadinews.com/article/diwali-2026-date-lakshmi-puja-muhurat);
   [Bhai Dooj (Wikipedia)](https://en.wikipedia.org/wiki/Bhai_Dooj);
   [Diwali 2026 (Bhaktiangan)](https://bhaktiangan.com/diwali-2026/)
4. [Maha Shivaratri 2027 (GrahaVaani)](https://www.grahavaani.com/festival/maha-shivaratri-2027);
   [Maha Shivaratri 2027 (Samvat)](https://samvat.in/festivals/maha-shivaratri-2027/)
5. [Holi 2027 by city (Nitya)](https://getnitya.com/en/festivals/holi/);
   [Holi 2027 (Divine Hindu)](https://www.divinehindu.in/blogs/news/holi-holika-dahan-2027-date-muhurat-significance)
6. [Sharad Navaratri 2027 (Samvat)](https://samvat.in/festivals/navaratri-2027/);
   [Navratri 2027 (Bhaktiangan)](https://bhaktiangan.com/navratri-2027/)

## Follow-up on the two to check (14 October 2026)

**Bhai Dooj: keep Tue 10 November.** UK-specific sources agree it falls a day
before India (Wed 11 November) because the tithi starts on the 10th in UK
time: [HinduTone's UK guide](https://hindutone.com/festivals/bhai-dooj-2026-uk-date-tilak/)
(citing Drik Panchang's UK dates) and
[Universal Time Date (London)](https://www.universaltimedate.com/holidays/bhai-dooj).
It can be marked as checked once a panditji agrees.

**Annakut / Gujarati New Year: decided on Tue 10 November (16 October).**
Toran-Main-Code PR #49 moves the site's date. It stays "not yet checked" until
someone ticks it off against a Gujarati panchang in `/ops/festivals`.

**Knock-on for Bhai Dooj:** Bhai Dooj (Bhai Bij) is the day after the new
year (Dwitiya). If the new year's Pratipada is on 10 November at London
sunrise, Bhai Dooj would fall on **Wed 11 November**, not the 10th the UK
guides give. Worth asking the same panditji.

Before the decision, the sources disagreed:

- [HinduTone's UK guide](https://hindutone.com/festivals/govardhan-puja-2026-uk-date-annakut/)
  says Govardhan Puja and Annakut are on **Mon 9 November** in the UK, and a
  HinduTone round-up says Neasden plans its Annakut on 9 November
  ([Diwali in London guide](https://hindutone.com/festivals/diwali-2026-celebrations-london-complete-guide-events/)).
- [Drik Panchang](https://www.drikpanchang.com/festivals/govardhan-puja/govardhan-puja-date-time.html)
  shows Shukla Pratipada at London sunrise on **Tue 10 November**, which
  would put it on the 10th.
- The Gujarati New Year (Bestu Varas, Vikram Samvat 2083) is widely given as
  **Tue 10 November**, but from Indian times
  ([HinduTone](https://hindutone.com/festivals/gujarati-new-year-2026-bestu-varas-date/)).

Mandirs may celebrate on either day, which is why each mandir's own Annakut
event is what matters on Toran. **Suggested action:** ask a panditji, or check
Neasden's official Diwali programme when it's published, then set the date
in `/ops/festivals` and mark it checked.

