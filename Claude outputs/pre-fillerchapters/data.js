/* ============================================================
   data.js — all site content.

   This is the file a board member can safely edit. Every list
   below is a collection the admin console can also manage from
   the browser. Editing here changes the content everyone sees
   on first load; editing in the browser only changes that
   person's copy (see README, "How content is stored").

   Every record needs a unique "id". Nothing else is required.
   ============================================================ */

window.Studs = window.Studs || {};

window.Studs.seed = {

  /* Gold strip under the hero. Keep to four — it is a grid. */
  stats:[
    {id:"s1",k:"Season 25/26 · 5th div. north",v:"Champions",n:"Striking Stallions"},
    {id:"s2",k:"Season 25/26 · 6th div. north",v:"2nd place",n:"Slapping Studs 1"},
    {id:"s3",k:"On the ice since",v:"1982",n:"44 seasons"},
    {id:"s4",k:"Members",v:"50+",n:"4 squads · 25% international"}
  ],

  /* status: "published" is public, "draft" is admin-only and
     shows in the feed with a DRAFT pill.

     excerpt = the teaser under the tile on the home page and in
     the feed. body = the article itself, shown on post.html; a
     blank line starts a new paragraph. Each post's picture is
     uploaded into images["news:<id>"] from the site itself.

     The bodies below are scaffolding: they restate the excerpt and
     nothing more, because the club's own wording is the only
     source we have. The board overwrites them in the console. */
  news:[
    {id:"n1",title:"End of season '25–'26",date:"22 April 2026",tag:"Season report",author:"Charlotte van Mourik",
     excerpt:"All Studs teams have shown hard work and dedication. Team 1 second in the North 6th Division, Team 2 sixth, and the Striking Stallions champions of the 5th Division North.",body:"All Studs teams have shown hard work and dedication this season.\n\nSlapping Studs 1 finished second in the North 6th Division and Slapping Studs 2 finished sixth. The Striking Stallions took the 5th Division North.\n\nFull write-up to follow from the board.",
     status:"published"},
    {id:"n2",title:"Champions of the North, 5th Division",date:"24 March 2026",tag:"Result",author:"Charlotte van Mourik",
     excerpt:"Congratulations to the Striking Stallions. The battle isn't over yet — the 5th division championship game follows in Leiden.",body:"Congratulations to the Striking Stallions, champions of the 5th Division North.\n\nThe battle is not over yet: the 5th division championship game follows in Leiden.\n\nMatch report to follow.",
     status:"published"},
    {id:"n3",title:"Night tournament sign-up is open",date:"02 March 2026",tag:"Event",author:"Off-Ice Committee",
     excerpt:"Hockey and a party, straight through the night at IJsbaan Twente. Teams of six, mixed levels, rookies encouraged.",body:"Sign-up for the night tournament is open.\n\nHockey and a party, straight through the night at IJsbaan Twente. Teams of six, mixed levels, and rookies are encouraged to enter.\n\nTimes, entry details and the sign-up form to be added here.",
     status:"published"},
    {id:"n4",title:"Two free introduction practices",date:"11 October 2025",tag:"Join us",author:"Board",
     excerpt:"Skates, stick and full gear provided. You need nothing but a pair of gloves and the willingness to fall over in front of strangers.",body:"Two free introduction practices run each year.\n\nSkates, stick and full gear are provided. You need nothing but a pair of gloves and the willingness to fall over in front of strangers.\n\nDates and how to sign up: see the join page.",
     status:"published"},
    {id:"n5",title:"Board handover 2026–27",date:"01 May 2026",tag:"Club",author:"Board",
     excerpt:"Draft announcement of next season's board. Not published yet — visible to admins only, with a DRAFT pill on the feed.",body:"Draft announcement of next season's board.\n\nNot published yet - visible to admins only, and shown in the feed with a DRAFT pill.",
     status:"draft"}
  ],

  /* kind: "home" | "away" | "" (no badge)
     team: the squad that plays it (games only) - the member area
     asks that squad for its availability; everyone else may RSVP. */
  events:[
    {id:"e1",dd:"12",mm:"Apr",title:"Championship final · 5th div.",meta:"09:00 · Leiden",kind:"away",team:"Stallions"},
    {id:"e2",dd:"18",mm:"Apr",title:"Studs 2 vs. Enschede Lions",meta:"21:15 · IJsbaan Twente",kind:"home",team:"Studs 2"},
    {id:"e3",dd:"26",mm:"Apr",title:"Night tournament",meta:"20:00 → 04:00 · IJsbaan Twente",kind:""},
    {id:"e4",dd:"09",mm:"May",title:"End-of-season BBQ",meta:"17:00 · Sportcentrum UT",kind:""},
    {id:"e5",dd:"24",mm:"Aug",title:"Kick-In · Studs stand",meta:"All day · Campus UT",kind:""}
  ],

  /* Housekeeping that never earns a news post: gear, votes, lost
     kit, carpools. "when" is a ready-made display string like the
     rest of this file's meta fields (not computed from a real
     clock) - the board updates it when the item stops being new,
     the same way it edits a news post's date. Newest first; the
     board reorders by moving entries, there's no separate sort. */
  announcements:[
    {id:"a1",tag:"Gear",text:"Order training jerseys by Friday — sign-up sheet is in the clubhouse.",when:"2 days ago"},
    {id:"a2",tag:"Vote",text:"Captain vote for next season closes Sunday night.",when:"3 days ago"},
    {id:"a3",tag:"Logistics",text:"Carpool to the Leiden final — two seats still needed.",when:"5 days ago"},
    {id:"a4",tag:"Housekeeping",text:"Return locker room keys to the equipment room after practice.",when:"6 days ago"}
  ],

  /* REAL ROSTER, taken from slappingstuds.nl/players (names,
     numbers, positions and squad are the club's own published
     data). "#0" means no number assigned yet — rendered as "—".
     Scoring figures are NOT public and are not stored here;
     the scoring table generates illustrative numbers and says so.
     pos:  Goaltender | Defence | Forward
     team: Studs 1 | Studs 2 | Stallions | Cadets            */
  players:[
    /* --- goaltenders --- */
    {id:"pl01",no:"31",name:"Sean Lokerse",pos:"Goaltender",team:"Studs 2"},
    {id:"pl02",no:"44",name:"Sylvio van Ditzhuyzen",pos:"Goaltender",team:"Stallions"},
    {id:"pl03",no:"45",name:"Branislav Javor",pos:"Goaltender",team:"Studs 1"},
    {id:"pl04",no:"48",name:"Tiemen English",pos:"Goaltender",team:"Studs 1"},

    /* --- defence --- */
    {id:"pl05",no:"2", name:"Kira Khalil",pos:"Defence",team:"Studs 2"},
    {id:"pl06",no:"7", name:"Eva Bramer",pos:"Defence",team:"Studs 1"},
    {id:"pl07",no:"10",name:"Bas Pellen",pos:"Defence",team:"Stallions"},
    {id:"pl08",no:"12",name:"Elmer Lastdrager",pos:"Defence",team:"Cadets"},
    {id:"pl09",no:"18",name:"Paul Harms",pos:"Defence",team:"Studs 2"},
    {id:"pl10",no:"19",name:"Samuel Pozdech",pos:"Defence",team:"Studs 1"},
    {id:"pl11",no:"50",name:"Casper Lastdrager",pos:"Defence",team:"Stallions"},
    {id:"pl12",no:"66",name:"Benthe Evers",pos:"Defence",team:"Studs 1"},
    {id:"pl13",no:"83",name:"Joël Harms",pos:"Defence",team:"Stallions"},
    {id:"pl14",no:"88",name:"Mark Tool",pos:"Defence",team:"Studs 2"},
    {id:"pl15",no:"96",name:"Ino Lambers",pos:"Defence",team:"Cadets"},
    {id:"pl16",no:"97",name:"Emil Gravier",pos:"Defence",team:"Studs 1"},
    {id:"pl17",no:"0", name:"Bas Bloemendal",pos:"Defence",team:"Cadets"},
    {id:"pl18",no:"0", name:"Maud van Oost",pos:"Defence",team:"Studs 2"},
    {id:"pl19",no:"0", name:"Sef Theunissen",pos:"Defence",team:"Studs 2"},
    {id:"pl20",no:"0", name:"Lieke de Rooij",pos:"Defence",team:"Studs 2"},
    {id:"pl21",no:"0", name:"Roos Heij",pos:"Defence",team:"Studs 2"},
    {id:"pl22",no:"0", name:"Meike Gellweiler",pos:"Defence",team:"Cadets"},
    {id:"pl23",no:"0", name:"Elisabeth van der Paardt",pos:"Defence",team:"Studs 2"},
    {id:"pl24",no:"0", name:"Krištof Husár",pos:"Defence",team:"Stallions"},
    {id:"pl25",no:"0", name:"Matthijs Deunk",pos:"Defence",team:"Studs 2"},
    {id:"pl26",no:"0", name:"Thomas Ryder-Hansen",pos:"Defence",team:"Studs 2"},
    {id:"pl27",no:"0", name:"Mees Visser",pos:"Defence",team:"Cadets"},
    {id:"pl28",no:"0", name:"Janine Bosma",pos:"Defence",team:"Cadets"},
    {id:"pl29",no:"0", name:"Puck Heijstek",pos:"Defence",team:"Cadets"},
    {id:"pl30",no:"0", name:"Linda Borkhuis",pos:"Defence",team:"Cadets"},
    {id:"pl31",no:"0", name:"Fenna van der Werff",pos:"Defence",team:"Studs 2"},
    {id:"pl32",no:"0", name:"Meike Blaauw",pos:"Defence",team:"Cadets"},
    {id:"pl33",no:"0", name:"Tomáš Bartošovič",pos:"Defence",team:"Stallions"},

    /* --- forwards --- */
    {id:"pl34",no:"5", name:"Zsombor Zoltan Ivanyi",pos:"Forward",team:"Cadets"},
    {id:"pl35",no:"8", name:"Luca Patty",pos:"Forward",team:"Studs 1"},
    {id:"pl36",no:"17",name:"Roxy Fokker",pos:"Forward",team:"Stallions"},
    {id:"pl37",no:"21",name:"Kenzy Sanjaya",pos:"Forward",team:"Studs 2"},
    {id:"pl38",no:"22",name:"Kim Zwart",pos:"Forward",team:"Stallions"},
    {id:"pl39",no:"24",name:"David den Boer",pos:"Forward",team:"Cadets"},
    {id:"pl40",no:"24",name:"Kylar de Boer",pos:"Forward",team:"Studs 2"},
    {id:"pl41",no:"26",name:"Iris Kouwenberg",pos:"Forward",team:"Studs 1"},
    {id:"pl42",no:"27",name:"Iris van Veldhuizen",pos:"Forward",team:"Studs 2"},
    {id:"pl43",no:"33",name:"Ruben Bralts",pos:"Forward",team:"Stallions"},
    {id:"pl44",no:"36",name:"Frank Lammers",pos:"Forward",team:"Stallions"},
    {id:"pl45",no:"40",name:"Matthias Kruit",pos:"Forward",team:"Stallions"},
    {id:"pl46",no:"44",name:"Daniel Simon",pos:"Forward",team:"Studs 1"},
    {id:"pl47",no:"46",name:"Danny van der Goot",pos:"Forward",team:"Stallions"},
    {id:"pl48",no:"52",name:"Roman Tyunkin",pos:"Forward",team:"Stallions"},
    {id:"pl49",no:"58",name:"Roselieke Kuiken",pos:"Forward",team:"Studs 2"},
    {id:"pl50",no:"61",name:"Vito Böke",pos:"Forward",team:"Stallions"},
    {id:"pl51",no:"68",name:"Charlotte van Mourik",pos:"Forward",team:"Studs 1"},
    {id:"pl52",no:"71",name:"Sean Berkenpas",pos:"Forward",team:"Studs 1"},
    {id:"pl53",no:"75",name:"Andries-Jan van der Werff",pos:"Forward",team:"Studs 2"},
    {id:"pl54",no:"77",name:"Wieland Nobel",pos:"Forward",team:"Studs 2"},
    {id:"pl55",no:"93",name:"Are Jilesen",pos:"Forward",team:"Studs 1"},
    {id:"pl56",no:"94",name:"Anthony Mammoliti",pos:"Forward",team:"Stallions"},
    {id:"pl57",no:"95",name:"Alexandru Condu",pos:"Forward",team:"Studs 1"},
    {id:"pl58",no:"99",name:"Daan Westerhof",pos:"Forward",team:"Stallions"},
    {id:"pl59",no:"0", name:"Caitlin Snijders",pos:"Forward",team:"Cadets"}
  ],

  /* Coaching staff and mascot — shown under the roster. */
  staff:[
    {id:"sf1",name:"Tony Tran-Chau",role:"Coach"},
    {id:"sf2",name:"Slappy the Stud",role:"Mascot"}
  ],

  /* outcome: "w" | "l" | "" (not played yet) */
  games:[
    {id:"g1",date:"12.04.26",team:"Stallions",fixture:"Championship final · 5th div.",venue:"Leiden",result:"09:00",outcome:""},
    {id:"g2",date:"22.03.26",team:"Stallions",fixture:"Slapping Studs — Gijs Groningen 4",venue:"IJsbaan Twente",result:"4–3 W",outcome:"w"},
    {id:"g3",date:"15.03.26",team:"Studs 1",fixture:"Enschede Lions — Slapping Studs 1",venue:"IJsbaan Twente",result:"2–5 L",outcome:"l"},
    {id:"g4",date:"08.03.26",team:"Studs 2",fixture:"Slapping Studs 2 — HELA Amsterdam",venue:"IJsbaan Twente",result:"6–2 W",outcome:"w"},
    {id:"g5",date:"01.03.26",team:"Stallions",fixture:"Leiden Blues — Slapping Studs",venue:"De Vliet, Leiden",result:"1–4 W",outcome:"w"},
    {id:"g6",date:"22.02.26",team:"Studs 1",fixture:"Slapping Studs 1 — Slapping Studs 2",venue:"IJsbaan Twente",result:"5–3 W",outcome:"w"}
  ],

  /* PLACEHOLDER — past results are not published anywhere we
     could read them. Structure is real; fill from the club's
     own records, season by season. */
  pastgames:[
    {id:"pg1",season:"2024–25",date:"29.03.25",team:"Studs 1",fixture:"Slapping Studs 1 — Zoetermeer Wild Panters",venue:"IJsbaan Twente",result:"3–2 W",outcome:"w"},
    {id:"pg2",season:"2024–25",date:"15.03.25",team:"Stallions",fixture:"Loki Amsterdam — Slapping Studs",venue:"Jaap Eden, Amsterdam",result:"5–1 L",outcome:"l"},
    {id:"pg3",season:"2024–25",date:"01.02.25",team:"Studs 2",fixture:"Slapping Studs 2 — OG Capitals Leeuwarden 6",venue:"IJsbaan Twente",result:"4–4 D",outcome:""},
    {id:"pg4",season:"2023–24",date:"17.03.24",team:"Studs 1",fixture:"Blue Mountain Cougars Hoorn 3 — Slapping Studs 1",venue:"De Westfries, Hoorn",result:"2–6 W",outcome:"w"},
    {id:"pg5",season:"2023–24",date:"03.02.24",team:"Stallions",fixture:"Slapping Studs — Slapstick Flyers Heerenveen",venue:"IJsbaan Twente",result:"2–3 L",outcome:"l"},
    {id:"pg6",season:"2022–23",date:"11.03.23",team:"Studs 1",fixture:"NSK final round",venue:"Tilburg",result:"4th",outcome:""}
  ],

  /* GAME SHEETS — rendered by game.html?id=<fixture id>.
     One gamesheets record per published game, keyed by "game" =
     the fixture's id in games[] or pastgames[]; the goals,
     penalties and lineup live in their own flat collections so
     the admin drawer can edit one row at a time.

     PLACEHOLDER. Sheets exist for g6 (this season) and pg1–pg5 (the
     archive); the NSK round pg6 has none. Studs names are the real
     rosters from players[] above; opponents are shown as "CODE #no"
     rather than invented people; every time, goal, penalty and stat
     line is made up to show the layout and must be replaced from the
     real game sheets. Referees on the archive sheets are literally
     "Placeholder". Period splits must add up to hs / as. */
  gamesheets:[
    {id:"gs1",game:"g6",comp:"6th Division North · Game 14",
     home:"Slapping Studs 1",away:"Slapping Studs 2",homeRec:"8–4–1",awayRec:"4–9–0",
     hs:"5",as:"3",status:"FT",hp:"1-2-2",ap:"2-1-0",
     date:"Sun 22 Feb 2026",faceoff:"20:30",venue:"IJsbaan Twente",refs:"De Vries · Hakkers",
     star1:"Luca Patty",star1line:"2G 1A · 4 shots · won 8/11 draws",
     star2:"Tiemen English",star2line:"18 saves on 21 · .857 SV%",
     star3:"Charlotte van Mourik",star3line:"0G 2A · +3 · 21:04 on ice",
     report:"Two goals down after a first period nobody wants to talk about, and then Patty decided the evening was going differently. Studs 2 travelled the length of the corridor with fifteen skaters and ran out of legs somewhere in the middle of the second; Studs 1 did not.\n\nNinety in the stands, all of them ours, half of them not sure who to cheer for."},
    {id:"gs2",game:"pg1",comp:"6th Division North · 2024–25",
     home:"Slapping Studs 1",away:"Zoetermeer Wild Panters",homeRec:"7–5–1",awayRec:"4–8–1",
     hs:"3",as:"2",status:"FT",hp:"1-1-1",ap:"0-2-0",
     date:"Sat 29 Mar 2025",faceoff:"20:30",venue:"IJsbaan Twente",refs:"Placeholder · Placeholder",
     star1:"Iris Kouwenberg",star1line:"1G 0A · game winner",
     star2:"Tiemen English",star2line:"24 saves on 26 · .923 SV%",
     star3:"Luca Patty",star3line:"1G 1A · 5 shots",
     report:"A one-goal game the whole way, settled on the power play with six minutes left."},
    {id:"gs3",game:"pg2",comp:"5th Division North · 2024–25",
     home:"Loki Amsterdam",away:"Striking Stallions",homeRec:"9–3–0",awayRec:"5–6–1",
     hs:"5",as:"1",status:"FT",hp:"2-2-1",ap:"0-1-0",
     date:"Sat 15 Mar 2025",faceoff:"19:15",venue:"Jaap Eden, Amsterdam",refs:"Placeholder · Placeholder",
     star1:"Sylvio van Ditzhuyzen",star1line:"31 saves on 36",
     star2:"Roman Tyunkin",star2line:"1G 0A · 4 shots",
     star3:"Bas Pellen",star3line:"0G 1A · 24:10 on ice",
     report:"Outshot from the first shift; the goal in the second was the one bright moment of a long bus ride home."},
    {id:"gs4",game:"pg3",comp:"6th Division North · 2024–25",
     home:"Slapping Studs 2",away:"OG Capitals Leeuwarden 6",homeRec:"3–7–0",awayRec:"4–6–0",
     hs:"4",as:"4",status:"FT",hp:"1-2-1",ap:"2-1-1",
     date:"Sat 1 Feb 2025",faceoff:"20:30",venue:"IJsbaan Twente",refs:"Placeholder · Placeholder",
     star1:"Kylar de Boer",star1line:"1G 1A · 6 shots",
     star2:"Kenzy Sanjaya",star2line:"1G 1A · +1",
     star3:"Sean Lokerse",star3line:"27 saves on 31",
     report:"Eight goals, four lead changes and a draw nobody on either bench was happy with."},
    {id:"gs5",game:"pg4",comp:"6th Division North · 2023–24",
     home:"Blue Mountain Cougars Hoorn 3",away:"Slapping Studs 1",homeRec:"5–7–0",awayRec:"8–4–0",
     hs:"2",as:"6",status:"FT",hp:"1-0-1",ap:"2-2-2",
     date:"Sun 17 Mar 2024",faceoff:"17:45",venue:"De Westfries, Hoorn",refs:"Placeholder · Placeholder",
     star1:"Luca Patty",star1line:"2G 1A · 7 shots",
     star2:"Charlotte van Mourik",star2line:"1G 1A · +4",
     star3:"Branislav Javor",star3line:"19 saves on 21",
     report:"The road win of the season. Two goals a period and never once behind."},
    {id:"gs6",game:"pg5",comp:"5th Division North · 2023–24",
     home:"Striking Stallions",away:"Slapstick Flyers Heerenveen",homeRec:"4–6–1",awayRec:"6–5–0",
     hs:"2",as:"3",status:"FT",hp:"1-1-0",ap:"1-1-1",
     date:"Sat 3 Feb 2024",faceoff:"20:30",venue:"IJsbaan Twente",refs:"Placeholder · Placeholder",
     star1:"SFH #10",star1line:"2G 0A",
     star2:"Kim Zwart",star2line:"1G 0A · 5 shots",
     star3:"Sylvio van Ditzhuyzen",star3line:"28 saves on 31",
     report:"Level twice, and then one bounce in the third that went the wrong way."}
  ],
  sheetgoals:[
    {id:"sg1",game:"g6",per:"1",time:"04:12",team:"ST2",scorer:"Mark Tool",assists:"Kylar de Boer",sit:"EV",score:"0–1"},
    {id:"sg2",game:"g6",per:"1",time:"11:47",team:"ST2",scorer:"Sef Theunissen",assists:"—",sit:"PP",score:"0–2"},
    {id:"sg3",game:"g6",per:"1",time:"17:30",team:"ST1",scorer:"Luca Patty",assists:"Charlotte van Mourik, Daniel Simon",sit:"EV",score:"1–2"},
    {id:"sg4",game:"g6",per:"2",time:"02:55",team:"ST1",scorer:"Daniel Simon",assists:"Charlotte van Mourik",sit:"PP",score:"2–2"},
    {id:"sg5",game:"g6",per:"2",time:"09:18",team:"ST2",scorer:"Kylar de Boer",assists:"Kenzy Sanjaya",sit:"EV",score:"2–3"},
    {id:"sg6",game:"g6",per:"2",time:"16:02",team:"ST1",scorer:"Luca Patty",assists:"Samuel Pozdech",sit:"EV",score:"3–3"},
    {id:"sg7",game:"g6",per:"3",time:"07:41",team:"ST1",scorer:"Iris Kouwenberg",assists:"Luca Patty, Eva Bramer",sit:"EV",score:"4–3"},
    {id:"sg8",game:"g6",per:"3",time:"19:12",team:"ST1",scorer:"Sean Berkenpas",assists:"—",sit:"EN",score:"5–3"},
    {id:"sg9",game:"pg1",per:"1",time:"08:14",team:"ST1",scorer:"Luca Patty",assists:"Charlotte van Mourik",sit:"EV",score:"1–0"},
    {id:"sg10",game:"pg1",per:"2",time:"05:40",team:"ZWP",scorer:"ZWP #9",assists:"ZWP #14",sit:"PP",score:"1–1"},
    {id:"sg11",game:"pg1",per:"2",time:"12:02",team:"ST1",scorer:"Daniel Simon",assists:"Luca Patty, Eva Bramer",sit:"EV",score:"2–1"},
    {id:"sg12",game:"pg1",per:"2",time:"18:55",team:"ZWP",scorer:"ZWP #21",assists:"—",sit:"EV",score:"2–2"},
    {id:"sg13",game:"pg1",per:"3",time:"14:31",team:"ST1",scorer:"Iris Kouwenberg",assists:"Samuel Pozdech",sit:"PP",score:"3–2"},
    {id:"sg14",game:"pg2",per:"1",time:"03:02",team:"LOK",scorer:"LOK #7",assists:"LOK #19",sit:"EV",score:"1–0"},
    {id:"sg15",game:"pg2",per:"1",time:"15:48",team:"LOK",scorer:"LOK #11",assists:"LOK #7",sit:"PP",score:"2–0"},
    {id:"sg16",game:"pg2",per:"2",time:"06:21",team:"LOK",scorer:"LOK #19",assists:"—",sit:"EV",score:"3–0"},
    {id:"sg17",game:"pg2",per:"2",time:"10:05",team:"STA",scorer:"Roman Tyunkin",assists:"Kim Zwart, Bas Pellen",sit:"EV",score:"3–1"},
    {id:"sg18",game:"pg2",per:"2",time:"17:40",team:"LOK",scorer:"LOK #7",assists:"LOK #11",sit:"EV",score:"4–1"},
    {id:"sg19",game:"pg2",per:"3",time:"09:12",team:"LOK",scorer:"LOK #23",assists:"LOK #19",sit:"EN",score:"5–1"},
    {id:"sg20",game:"pg3",per:"1",time:"02:47",team:"OGC",scorer:"OGC #12",assists:"OGC #4",sit:"EV",score:"0–1"},
    {id:"sg21",game:"pg3",per:"1",time:"09:30",team:"ST2",scorer:"Kylar de Boer",assists:"Kenzy Sanjaya",sit:"EV",score:"1–1"},
    {id:"sg22",game:"pg3",per:"1",time:"16:12",team:"OGC",scorer:"OGC #8",assists:"—",sit:"PP",score:"1–2"},
    {id:"sg23",game:"pg3",per:"2",time:"04:55",team:"ST2",scorer:"Mark Tool",assists:"Sef Theunissen",sit:"PP",score:"2–2"},
    {id:"sg24",game:"pg3",per:"2",time:"13:20",team:"ST2",scorer:"Kenzy Sanjaya",assists:"Kylar de Boer, Paul Harms",sit:"EV",score:"3–2"},
    {id:"sg25",game:"pg3",per:"2",time:"19:01",team:"OGC",scorer:"OGC #12",assists:"OGC #8",sit:"EV",score:"3–3"},
    {id:"sg26",game:"pg3",per:"3",time:"07:38",team:"ST2",scorer:"Wieland Nobel",assists:"Iris van Veldhuizen",sit:"EV",score:"4–3"},
    {id:"sg27",game:"pg3",per:"3",time:"18:49",team:"OGC",scorer:"OGC #4",assists:"OGC #12",sit:"EV",score:"4–4"},
    {id:"sg28",game:"pg4",per:"1",time:"05:10",team:"ST1",scorer:"Luca Patty",assists:"Daniel Simon",sit:"EV",score:"0–1"},
    {id:"sg29",game:"pg4",per:"1",time:"11:33",team:"BMC",scorer:"BMC #16",assists:"BMC #5",sit:"EV",score:"1–1"},
    {id:"sg30",game:"pg4",per:"1",time:"18:20",team:"ST1",scorer:"Charlotte van Mourik",assists:"Luca Patty",sit:"PP",score:"1–2"},
    {id:"sg31",game:"pg4",per:"2",time:"03:48",team:"ST1",scorer:"Daniel Simon",assists:"Eva Bramer",sit:"EV",score:"1–3"},
    {id:"sg32",game:"pg4",per:"2",time:"15:07",team:"ST1",scorer:"Sean Berkenpas",assists:"Iris Kouwenberg, Benthe Evers",sit:"EV",score:"1–4"},
    {id:"sg33",game:"pg4",per:"3",time:"06:25",team:"ST1",scorer:"Luca Patty",assists:"Charlotte van Mourik",sit:"EV",score:"1–5"},
    {id:"sg34",game:"pg4",per:"3",time:"12:50",team:"BMC",scorer:"BMC #5",assists:"BMC #16",sit:"PP",score:"2–5"},
    {id:"sg35",game:"pg4",per:"3",time:"19:31",team:"ST1",scorer:"Iris Kouwenberg",assists:"—",sit:"EN",score:"2–6"},
    {id:"sg36",game:"pg5",per:"1",time:"07:19",team:"STA",scorer:"Frank Lammers",assists:"Ruben Bralts",sit:"EV",score:"1–0"},
    {id:"sg37",game:"pg5",per:"1",time:"13:44",team:"SFH",scorer:"SFH #10",assists:"SFH #27",sit:"EV",score:"1–1"},
    {id:"sg38",game:"pg5",per:"2",time:"08:02",team:"SFH",scorer:"SFH #27",assists:"—",sit:"PP",score:"1–2"},
    {id:"sg39",game:"pg5",per:"2",time:"16:36",team:"STA",scorer:"Kim Zwart",assists:"Roman Tyunkin, Casper Lastdrager",sit:"EV",score:"2–2"},
    {id:"sg40",game:"pg5",per:"3",time:"14:58",team:"SFH",scorer:"SFH #10",assists:"SFH #6",sit:"EV",score:"2–3"}
  ],
  sheetpens:[
    {id:"sp1",game:"g6",per:"1",time:"07:44",player:"ST2 · #88 Mark Tool",inf:"Tripping",min:"2:00"},
    {id:"sp2",game:"g6",per:"1",time:"10:31",player:"ST1 · #19 Samuel Pozdech",inf:"Hooking",min:"2:00"},
    {id:"sp3",game:"g6",per:"2",time:"01:20",player:"ST2 · #21 Kenzy Sanjaya",inf:"Slashing",min:"2:00"},
    {id:"sp4",game:"g6",per:"2",time:"13:58",player:"ST1 · #26 Iris Kouwenberg",inf:"Too many players",min:"2:00"},
    {id:"sp5",game:"g6",per:"3",time:"11:05",player:"ST2 · #18 Paul Harms",inf:"Roughing",min:"2+10"},
    {id:"sp6",game:"pg1",per:"1",time:"11:20",player:"ST1 · #19 Samuel Pozdech",inf:"Hooking",min:"2:00"},
    {id:"sp7",game:"pg1",per:"2",time:"04:58",player:"ST1 · #97 Emil Gravier",inf:"Tripping",min:"2:00"},
    {id:"sp8",game:"pg1",per:"3",time:"13:10",player:"ZWP · #14",inf:"Slashing",min:"2:00"},
    {id:"sp9",game:"pg2",per:"1",time:"14:30",player:"STA · #83 Joël Harms",inf:"Interference",min:"2:00"},
    {id:"sp10",game:"pg2",per:"2",time:"02:11",player:"LOK · #11",inf:"Tripping",min:"2:00"},
    {id:"sp11",game:"pg2",per:"3",time:"05:44",player:"STA · #40 Matthias Kruit",inf:"Roughing",min:"2:00"},
    {id:"sp12",game:"pg3",per:"1",time:"15:02",player:"ST2 · #18 Paul Harms",inf:"Hooking",min:"2:00"},
    {id:"sp13",game:"pg3",per:"2",time:"03:40",player:"OGC · #4",inf:"Tripping",min:"2:00"},
    {id:"sp14",game:"pg3",per:"3",time:"10:15",player:"ST2 · #88 Mark Tool",inf:"Cross-checking",min:"2:00"},
    {id:"sp15",game:"pg4",per:"1",time:"17:02",player:"BMC · #5",inf:"Holding",min:"2:00"},
    {id:"sp16",game:"pg4",per:"3",time:"11:58",player:"ST1 · #66 Benthe Evers",inf:"Tripping",min:"2:00"},
    {id:"sp17",game:"pg5",per:"2",time:"06:50",player:"STA · #61 Vito Böke",inf:"Slashing",min:"2:00"},
    {id:"sp18",game:"pg5",per:"2",time:"12:15",player:"SFH · #6",inf:"Hooking",min:"2:00"},
    {id:"sp19",game:"pg5",per:"3",time:"17:40",player:"STA · #10 Bas Pellen",inf:"Too many players",min:"2:00"}
  ],
  sheetlineup:[
    {id:"sl01",game:"g6",side:"home",pos:"Goalies", no:"48",name:"Tiemen English",stat:"18/21"},
    {id:"sl02",game:"g6",side:"home",pos:"Goalies", no:"45",name:"Branislav Javor",stat:"DNP"},
    {id:"sl03",game:"g6",side:"home",pos:"Defense", no:"7", name:"Eva Bramer",stat:"0/1/0"},
    {id:"sl04",game:"g6",side:"home",pos:"Defense", no:"19",name:"Samuel Pozdech",stat:"0/1/2"},
    {id:"sl05",game:"g6",side:"home",pos:"Defense", no:"66",name:"Benthe Evers",stat:"0/0/0"},
    {id:"sl06",game:"g6",side:"home",pos:"Defense", no:"97",name:"Emil Gravier",stat:"0/0/0"},
    {id:"sl07",game:"g6",side:"home",pos:"Forwards",no:"8", name:"Luca Patty",stat:"2/1/0"},
    {id:"sl08",game:"g6",side:"home",pos:"Forwards",no:"26",name:"Iris Kouwenberg",stat:"1/0/2"},
    {id:"sl09",game:"g6",side:"home",pos:"Forwards",no:"44",name:"Daniel Simon",stat:"1/1/0"},
    {id:"sl10",game:"g6",side:"home",pos:"Forwards",no:"68",name:"Charlotte van Mourik",stat:"0/2/0"},
    {id:"sl11",game:"g6",side:"home",pos:"Forwards",no:"71",name:"Sean Berkenpas",stat:"1/0/0"},
    {id:"sl12",game:"g6",side:"away",pos:"Goalies", no:"31",name:"Sean Lokerse",stat:"22/27"},
    {id:"sl13",game:"g6",side:"away",pos:"Defense", no:"2", name:"Kira Khalil",stat:"0/0/0"},
    {id:"sl14",game:"g6",side:"away",pos:"Defense", no:"18",name:"Paul Harms",stat:"0/0/12"},
    {id:"sl15",game:"g6",side:"away",pos:"Defense", no:"88",name:"Mark Tool",stat:"1/0/2"},
    {id:"sl16",game:"g6",side:"away",pos:"Defense", no:"0", name:"Sef Theunissen",stat:"1/0/0"},
    {id:"sl17",game:"g6",side:"away",pos:"Forwards",no:"21",name:"Kenzy Sanjaya",stat:"0/1/2"},
    {id:"sl18",game:"g6",side:"away",pos:"Forwards",no:"24",name:"Kylar de Boer",stat:"1/1/0"},
    {id:"sl19",game:"g6",side:"away",pos:"Forwards",no:"27",name:"Iris van Veldhuizen",stat:"0/0/0"},
    {id:"sl20",game:"g6",side:"away",pos:"Forwards",no:"58",name:"Roselieke Kuiken",stat:"0/0/0"},
    {id:"sl21",game:"pg1",side:"home",pos:"Goalies",no:"48",name:"Tiemen English",stat:"24/26"},
    {id:"sl22",game:"pg1",side:"home",pos:"Goalies",no:"45",name:"Branislav Javor",stat:"DNP"},
    {id:"sl23",game:"pg1",side:"home",pos:"Defense",no:"7",name:"Eva Bramer",stat:"—"},
    {id:"sl24",game:"pg1",side:"home",pos:"Defense",no:"19",name:"Samuel Pozdech",stat:"—"},
    {id:"sl25",game:"pg1",side:"home",pos:"Defense",no:"66",name:"Benthe Evers",stat:"—"},
    {id:"sl26",game:"pg1",side:"home",pos:"Defense",no:"97",name:"Emil Gravier",stat:"—"},
    {id:"sl27",game:"pg1",side:"home",pos:"Forwards",no:"8",name:"Luca Patty",stat:"—"},
    {id:"sl28",game:"pg1",side:"home",pos:"Forwards",no:"26",name:"Iris Kouwenberg",stat:"—"},
    {id:"sl29",game:"pg1",side:"home",pos:"Forwards",no:"44",name:"Daniel Simon",stat:"—"},
    {id:"sl30",game:"pg1",side:"home",pos:"Forwards",no:"68",name:"Charlotte van Mourik",stat:"—"},
    {id:"sl31",game:"pg1",side:"home",pos:"Forwards",no:"71",name:"Sean Berkenpas",stat:"—"},
    {id:"sl32",game:"pg2",side:"away",pos:"Goalies",no:"44",name:"Sylvio van Ditzhuyzen",stat:"31/36"},
    {id:"sl33",game:"pg2",side:"away",pos:"Defense",no:"10",name:"Bas Pellen",stat:"—"},
    {id:"sl34",game:"pg2",side:"away",pos:"Defense",no:"50",name:"Casper Lastdrager",stat:"—"},
    {id:"sl35",game:"pg2",side:"away",pos:"Defense",no:"83",name:"Joël Harms",stat:"—"},
    {id:"sl36",game:"pg2",side:"away",pos:"Defense",no:"0",name:"Krištof Husár",stat:"—"},
    {id:"sl37",game:"pg2",side:"away",pos:"Forwards",no:"17",name:"Roxy Fokker",stat:"—"},
    {id:"sl38",game:"pg2",side:"away",pos:"Forwards",no:"22",name:"Kim Zwart",stat:"—"},
    {id:"sl39",game:"pg2",side:"away",pos:"Forwards",no:"33",name:"Ruben Bralts",stat:"—"},
    {id:"sl40",game:"pg2",side:"away",pos:"Forwards",no:"36",name:"Frank Lammers",stat:"—"},
    {id:"sl41",game:"pg2",side:"away",pos:"Forwards",no:"40",name:"Matthias Kruit",stat:"—"},
    {id:"sl42",game:"pg2",side:"away",pos:"Forwards",no:"52",name:"Roman Tyunkin",stat:"—"},
    {id:"sl43",game:"pg2",side:"away",pos:"Forwards",no:"61",name:"Vito Böke",stat:"—"},
    {id:"sl44",game:"pg3",side:"home",pos:"Goalies",no:"31",name:"Sean Lokerse",stat:"27/31"},
    {id:"sl45",game:"pg3",side:"home",pos:"Defense",no:"2",name:"Kira Khalil",stat:"—"},
    {id:"sl46",game:"pg3",side:"home",pos:"Defense",no:"18",name:"Paul Harms",stat:"—"},
    {id:"sl47",game:"pg3",side:"home",pos:"Defense",no:"88",name:"Mark Tool",stat:"—"},
    {id:"sl48",game:"pg3",side:"home",pos:"Defense",no:"0",name:"Sef Theunissen",stat:"—"},
    {id:"sl49",game:"pg3",side:"home",pos:"Forwards",no:"21",name:"Kenzy Sanjaya",stat:"—"},
    {id:"sl50",game:"pg3",side:"home",pos:"Forwards",no:"24",name:"Kylar de Boer",stat:"—"},
    {id:"sl51",game:"pg3",side:"home",pos:"Forwards",no:"27",name:"Iris van Veldhuizen",stat:"—"},
    {id:"sl52",game:"pg3",side:"home",pos:"Forwards",no:"58",name:"Roselieke Kuiken",stat:"—"},
    {id:"sl53",game:"pg3",side:"home",pos:"Forwards",no:"75",name:"Andries-Jan van der Werff",stat:"—"},
    {id:"sl54",game:"pg3",side:"home",pos:"Forwards",no:"77",name:"Wieland Nobel",stat:"—"},
    {id:"sl55",game:"pg4",side:"away",pos:"Goalies",no:"48",name:"Tiemen English",stat:"DNP"},
    {id:"sl56",game:"pg4",side:"away",pos:"Goalies",no:"45",name:"Branislav Javor",stat:"19/21"},
    {id:"sl57",game:"pg4",side:"away",pos:"Defense",no:"7",name:"Eva Bramer",stat:"—"},
    {id:"sl58",game:"pg4",side:"away",pos:"Defense",no:"19",name:"Samuel Pozdech",stat:"—"},
    {id:"sl59",game:"pg4",side:"away",pos:"Defense",no:"66",name:"Benthe Evers",stat:"—"},
    {id:"sl60",game:"pg4",side:"away",pos:"Defense",no:"97",name:"Emil Gravier",stat:"—"},
    {id:"sl61",game:"pg4",side:"away",pos:"Forwards",no:"8",name:"Luca Patty",stat:"—"},
    {id:"sl62",game:"pg4",side:"away",pos:"Forwards",no:"26",name:"Iris Kouwenberg",stat:"—"},
    {id:"sl63",game:"pg4",side:"away",pos:"Forwards",no:"44",name:"Daniel Simon",stat:"—"},
    {id:"sl64",game:"pg4",side:"away",pos:"Forwards",no:"68",name:"Charlotte van Mourik",stat:"—"},
    {id:"sl65",game:"pg4",side:"away",pos:"Forwards",no:"71",name:"Sean Berkenpas",stat:"—"},
    {id:"sl66",game:"pg5",side:"home",pos:"Goalies",no:"44",name:"Sylvio van Ditzhuyzen",stat:"28/31"},
    {id:"sl67",game:"pg5",side:"home",pos:"Defense",no:"10",name:"Bas Pellen",stat:"—"},
    {id:"sl68",game:"pg5",side:"home",pos:"Defense",no:"50",name:"Casper Lastdrager",stat:"—"},
    {id:"sl69",game:"pg5",side:"home",pos:"Defense",no:"83",name:"Joël Harms",stat:"—"},
    {id:"sl70",game:"pg5",side:"home",pos:"Defense",no:"0",name:"Krištof Husár",stat:"—"},
    {id:"sl71",game:"pg5",side:"home",pos:"Forwards",no:"17",name:"Roxy Fokker",stat:"—"},
    {id:"sl72",game:"pg5",side:"home",pos:"Forwards",no:"22",name:"Kim Zwart",stat:"—"},
    {id:"sl73",game:"pg5",side:"home",pos:"Forwards",no:"33",name:"Ruben Bralts",stat:"—"},
    {id:"sl74",game:"pg5",side:"home",pos:"Forwards",no:"36",name:"Frank Lammers",stat:"—"},
    {id:"sl75",game:"pg5",side:"home",pos:"Forwards",no:"40",name:"Matthias Kruit",stat:"—"},
    {id:"sl76",game:"pg5",side:"home",pos:"Forwards",no:"52",name:"Roman Tyunkin",stat:"—"},
    {id:"sl77",game:"pg5",side:"home",pos:"Forwards",no:"61",name:"Vito Böke",stat:"—"}
  ],

  /* Division tables, rendered on games.html.
     div is what groups the rows; "us" marks a Studs squad so the
     table can show a gold dot against it.

     PARTLY PLACEHOLDER. The teams are the club's real opponents
     (see comps, below) and the two placings the club states
     elsewhere on this site are correct: the Striking Stallions
     won the 5th Division North, Slapping Studs 1 were second in
     the 6th. Every other position, and every number in every
     row, is invented to show the table and must be replaced from
     the league's own results before launch. */
  standings:[
    {id:"sd01",div:"6th Division North",pos:"1",team:"Enschede Lions",gp:"14",w:"11",otw:"1",l:"2",gd:"+31",pts:"34",us:""},
    {id:"sd02",div:"6th Division North",pos:"2",team:"Slapping Studs 1",gp:"14",w:"9",otw:"1",l:"4",gd:"+18",pts:"28",us:"yes"},
    {id:"sd03",div:"6th Division North",pos:"3",team:"HELA Amsterdam",gp:"14",w:"8",otw:"0",l:"6",gd:"+7",pts:"24",us:""},
    {id:"sd04",div:"6th Division North",pos:"4",team:"Blue Mountain Cougars Hoorn 3",gp:"14",w:"6",otw:"1",l:"7",gd:"-2",pts:"19",us:""},
    {id:"sd05",div:"6th Division North",pos:"5",team:"OG Capitals Leeuwarden 6",gp:"14",w:"5",otw:"0",l:"9",gd:"-11",pts:"15",us:""},
    {id:"sd06",div:"6th Division North",pos:"6",team:"Slapping Studs 2",gp:"14",w:"4",otw:"0",l:"10",gd:"-19",pts:"12",us:"yes"},
    {id:"sd07",div:"6th Division North",pos:"7",team:"Zoetermeer Wild Panters",gp:"14",w:"2",otw:"1",l:"11",gd:"-24",pts:"8",us:""},

    {id:"sd08",div:"5th Division North",pos:"1",team:"Striking Stallions",gp:"16",w:"13",otw:"1",l:"2",gd:"+38",pts:"40",us:"yes"},
    {id:"sd09",div:"5th Division North",pos:"2",team:"Leiden Blues",gp:"16",w:"11",otw:"1",l:"4",gd:"+24",pts:"34",us:""},
    {id:"sd10",div:"5th Division North",pos:"3",team:"Slapstick Flyers Heerenveen",gp:"16",w:"9",otw:"2",l:"5",gd:"+15",pts:"29",us:""},
    {id:"sd11",div:"5th Division North",pos:"4",team:"Loki Amsterdam",gp:"16",w:"8",otw:"1",l:"7",gd:"+6",pts:"25",us:""},
    {id:"sd12",div:"5th Division North",pos:"5",team:"Gijs Groningen 4",gp:"16",w:"6",otw:"1",l:"9",gd:"-4",pts:"19",us:""},
    {id:"sd13",div:"5th Division North",pos:"6",team:"OG Capitals Leeuwarden 5",gp:"16",w:"5",otw:"1",l:"10",gd:"-13",pts:"16",us:""},
    {id:"sd14",div:"5th Division North",pos:"7",team:"Blue Mountain Cougars Hoorn 2",gp:"16",w:"4",otw:"0",l:"12",gd:"-26",pts:"12",us:""},
    {id:"sd15",div:"5th Division North",pos:"8",team:"Leiden Key Town Tigers",gp:"16",w:"2",otw:"1",l:"13",gd:"-40",pts:"8",us:""}
  ],

  /* The week's ice, rendered on training.html (gold strip + tickets).

     PLACEHOLDER times. The structure is the club's own: training is
     Monday, Wednesday and Friday; groups 1-3 and 4-6 skate in
     different slots on Monday and Wednesday (about 1.5 h each);
     Friday is one hour for everybody and only on the 1st, 3rd and
     5th Friday of the month.
       g1/t1 = first slot (group label, time), g2/t2 = second slot
       (leave empty when there is only one),
       len   = the line under the day,
       rule  = which weeks of the month the day runs, e.g. "1,3,5";
               empty = every week. The next dates are worked out
               from it, so nobody types them. */
  sessions:[
    {id:"ts1",day:"Monday",len:"1½ h per group",
     g1:"Groups 1–3",t1:"19:30 - 21:00",g2:"Groups 4–6",t2:"21:00 - 22:30",rule:""},
    {id:"ts2",day:"Wednesday",len:"1½ h per group",
     g1:"Groups 4–6",t1:"19:30 - 21:00",g2:"Groups 1–3",t2:"21:00 - 22:30",rule:""},
    {id:"ts3",day:"Friday",len:"1 h · 1st, 3rd, 5th",
     g1:"All groups",t1:"21:00 - 22:00",g2:"",t2:"",rule:"1,3,5"}
  ],

  /* What to bring and what the club lends, one list. "Yes ..." in
     loan = the club lends it (ticked box); anything else = you bring
     it (empty box). */
  kit:[
    {id:"kt1",item:"Skates",loan:"Yes - sizes 37 to 48"},
    {id:"kt2",item:"Helmet with cage",loan:"Yes - and required"},
    {id:"kt3",item:"Gloves",loan:"Yes"},
    {id:"kt4",item:"Shoulder, elbow and shin pads",loan:"Yes - limited sizes"},
    {id:"kt5",item:"Stick",loan:"Yes - club sticks at the bench"},
    {id:"kt6",item:"Neck guard",loan:"Yes"},
    {id:"kt7",item:"Sports clothes",loan:"Bring your own, please"},
    {id:"kt8",item:"Towel and soap",loan:"For after - a shower beats the ride home"},
    {id:"kt9",item:"Bottle of water",loan:"Bring your own"}
  ],

  comps:[
    {id:"c1",yr:"01",nav:"The founding",kicker:"Chapter 01 · 1982",
     h:"In the\nbeginning",
     lead:"The Slapping Studs were born in February 1982, founded by Reinout Koelemij, Bert ten Vergert, Andre ten Vergert, Steven Gerdingh and Ché Hsin Falkenström — Ché most of all.",
     body:"At first the club played as part of the then first-division club Enschede Lions, in the national recreation league under the NIJB, against recreation teams from Heerenveen, Leeuwarden, Groningen and Assen. Friendlies followed against the Icehawks (Eindhoven), The Saints (Nijmegen) and Rheine.\n\nChé led on the ice and Bert ten Vergert coached, trying to teach the finer points of hockey to members who were mostly beginners from the university — while opponents had skated since childhood. It got harder still when the local club folded in 1987.\n\nLosing a lot builds a strong bond, and the membership stayed steady for a long time. The bright spots were the games against other student teams, where the levels were closer. From 1987 the NSK became the yearly highlight, and the Studs and Hooking from Eindhoven were the driving force behind the NSHL, the student league.\n\nAdapted from Timo Benthem's history of the club on slappingstuds.nl.",
     quote:"We're an association first and a team second. The results are what happens along the way.",
     cap:"Archive — first squads, jerseys, early clippings",
     shots:"3",media:"row"},
    {id:"c2",title:"Sixth division North",body:"Slapping Studs 1 and 2. HELA Amsterdam, Blue Mountain Cougars Hoorn 3, OG Capitals Leeuwarden 6, Enschede Lions, Zoetermeer Wild Panters — and each other."},
    {id:"c3",title:"NSK",body:"The Dutch Student Championship closes the season: a two-day event hosted by a different student ice hockey team each year."},
    {id:"c4",title:"Night tournament",body:"Our own end-of-season tournament at IJsbaan Twente. Hockey and a party, played into the night."}
  ],

  /* vis: "public" | "member" | "coach"  — who may open it
     cat: "games" | "tournaments" | "promo" | "coach" — dropdown filter
     cover / photos are filled by uploading through the site;
     both hold data URLs, never file paths.                   */
  albums:[
    {id:"al1",title:"Stallions — championship night",meta:"22 March 2026 · 148 photos",vis:"member",cat:"games",cover:"",photos:[]},
    {id:"al2",title:"Night tournament '26",meta:"26 April 2026 · 312 photos",vis:"member",cat:"tournaments",cover:"",photos:[]},
    {id:"al3",title:"NSK weekend",meta:"Two days · 204 photos",vis:"member",cat:"tournaments",cover:"",photos:[]},
    {id:"al4",title:"Kick-In promo",meta:"August 2025 · 61 photos",vis:"public",cat:"promo",cover:"",photos:[]},
    {id:"al5",title:"Coach film — powerplay drills",meta:"Internal · 24 clips",vis:"coach",cat:"coach",cover:"",photos:[]},
    {id:"al6",title:"Studs 2 vs. Enschede Lions",meta:"18 April 2026 · 96 photos",vis:"member",cat:"games",cover:"",photos:[]}
  ],

  /* Real board, from slappingstuds.nl. Update after each AGM. */
  board:[
    {id:"b1",name:"Anthony Mammoliti",role:"Chairman · Voorzitter",email:"voorzitter@slappingstuds.nl"},
    {id:"b2",name:"Roselieke Kuiken",role:"Secretary · Secretaris",email:"secretaris@slappingstuds.nl"},
    {id:"b3",name:"Iris van Veldhuizen",role:"Treasurer · Penningmeester",email:"penningmeester@slappingstuds.nl"},
    {id:"b4",name:"Danny van der Goot",role:"Game coordinator · Wedstrijdsecretaris",email:"wedstrijdsecretaris@slappingstuds.nl"}
  ],

  /* The scrolling timeline on history.html. renderTimeline() in
     js/views.js turns each row into a moment — photo + big year +
     one line of copy. The photo uploads into images["timeline:<id>"].
       yr    the punched year / label (kept short — it is set huge)
       lb    the headline for the moment
       body  one or two sentences, no more
       cap   the small caption line under it (place — date)

     PARTLY PLACEHOLDER — 1982, 2026 and "Today" are real. The
     1990s / 2000s / 2018 moments are invented structure and must
     be replaced from the club archive before launch. */
  timeline:[
    {id:"t1",yr:"1982",lb:"Founded",cap:"Enschede · February 1982",
     body:"A handful of University of Twente students — Reinout Koelemij, Bert and Andre ten Vergert, Steven Gerdingh and Ché Hsin Falkenström — start The Slapping Studs, first as part of the first-division club Enschede Lions."},
    {id:"t2",yr:"1990s",lb:"A home rink",cap:"IJsbaan Twente · Colosseum 90",
     body:"IJsbaan Twente becomes the permanent home rink. The season settles into its lasting shape: on the ice October, off it April."},
    {id:"t3",yr:"2000s",lb:"English on the ice",cap:"Enschede · mid-2000s",
     body:"International students pass a quarter of the membership. Training, game sheets and eventually this website switch to English."},
    {id:"t4",yr:"2018",lb:"Two squads",cap:"5th & 6th Division North",
     body:"Numbers outgrow one team. Studs 1 and Studs 2 enter competition separately and the ice is split into groups by level."},
    {id:"t5",yr:"2026",lb:"First title",cap:"5th Division North · March 2026",
     body:"The Striking Stallions come from 3–1 down to win the decider 4–3 — the first divisional title in the club's history."},
    {id:"t6",yr:"Today",lb:"Four squads",cap:"Studs 1 · Studs 2 · Stallions · Cadets",
     body:"50+ members, one coach, and an Off-Ice Committee that keeps the calendar full when the rink is closed."}
  ],

  /* The history chapters. history.html builds one chapter per row
     (photo beside or above the text) plus the chapter rail, and
     re-renders whenever the admin edits this collection.
       yr      the year or date set large, also the rail label
       nav     the rail's short name
       kicker  a plain date line kept for the admin list only (not shown)
       h       "\n" becomes a line break in the heading (max two lines)
       lead    an optional larger opening line, set before the body
       body    a blank line starts a new paragraph
       quote   an optional pull quote
       cap     the caption: say what the photo SHOWS, never pass a
               found picture off as the club's own
       img     default picture (assets/...); an upload into
               images["chapter:<id>:0"] replaces it
       credit  photographer / licence, printed on the photo's corner
       creditUrl  link for the credit (licence or source page)
       shots   "0" = no photo, "1" = one photo
       media   "side" (beside the text) or "wide" (full width above)
       gold    true for the one chapter that is the title

     PARTLY PLACEHOLDER — the founding and the title are built from
     the club's own pages. The five-year chapters run 1982, 1987 ... 2022; those
     with no text of their own (1987, 1997, 2007, 2012, 2017) are marked
     placeholders. 1992, 2002 and "Every April" are
     plausible structure only and must be checked against the
     archive before launch. The 1982/1985/1964 photos are archive
     pictures of Dutch hockey and of the campus, not of the club. */
  chapters:[
    {id:"c1",yr:"1982",nav:"The foundation",kicker:"February 1982",
     h:"Some students,\nlooking for action",
     lead:"The Slapping Studs were not founded as a project or a plan. They were founded because a rink was there and nobody had booked the ice.",
     body:"The founders started out inside Enschede Lions, playing the national recreation league against Heerenveen, Leeuwarden, Groningen and Assen, with Bert ten Vergert as coach and Ché Hsin Falkenström leading on the ice.\n\nFour decades later that is still roughly how new members arrive: no tryout, no experience asked for, just the next introduction practice and a borrowed set of gear.",
     quote:"We're an association first and a team second. The results are what happens along the way.",
     cap:"Ice hockey on an Amsterdam canal, January 1982. The winter the club was founded, the Netherlands played on frozen canals.",
     img:"assets/nog-veel-mensen-op-het-ijs-ijshockey.jpg",
     credit:"Photo: Hans van Dijk / Anefo, CC0",
     creditUrl:"https://commons.wikimedia.org/wiki/File:Nog_veel_mensen_op_het_ijs._IJshockey_op_Amsterdamse_grachten,_Bestanddeelnr_931-9165.jpg",
     shots:"1",media:"side"},
    {id:"c6",yr:"1987",nav:"1987–1991",kicker:"1987–1991",
     h:"Chapter to\nbe written",
     lead:"",
     body:"Placeholder: this five-year chapter has no text yet. Add what happened between 1987 and 1991 — the squads, the rinks, the tournaments, the people.",
     quote:"",cap:"",shots:"0",media:"side"},
    {id:"c2",yr:"1992",nav:"Growing pains",kicker:"The 1990s",
     h:"One rink,\ntoo many skaters",
     lead:"",
     body:"By the 1990s the club had outgrown a single training slot. IJsbaan Twente became the fixed home rink and the season took the shape it still has: on the ice from October, off it from April.\n\nThe ice was split into groups by level so a first-year who had never skated and a player with a club background could share the same hour without either standing around. That split is still how a practice is run.",
     quote:"",
     cap:"A match on the Leidseplein in Amsterdam, December 1985.",
     img:"assets/ijshockeywedstrijd-op-het-leidseplein-te-amsterdam-tussen.jpg",
     credit:"Photo: Bart Molendijk / Anefo, CC0",
     creditUrl:"https://commons.wikimedia.org/wiki/File:IJshockeywedstrijd_op_het_Leidseplein_te_Amsterdam_tussen_leden_van_college_van_,_Bestanddeelnr_933-5129.jpg",
     shots:"1",media:"side"},
    {id:"c7",yr:"1997",nav:"1997–2001",kicker:"1997–2001",
     h:"Chapter to\nbe written",
     lead:"",
     body:"Placeholder: this five-year chapter has no text yet. Add what happened between 1997 and 2001 — the squads, the rinks, the tournaments, the people.",
     quote:"",cap:"",shots:"0",media:"side"},
    {id:"c3",yr:"2002",nav:"Going international",kicker:"The 2000s",
     h:"English\non the ice",
     lead:"A Dutch student club where nobody has to apologise for not speaking Dutch yet. New arrivals still mention it first.",
     body:"As the University of Twente took in more international students, so did the Studs. Once roughly a quarter of the members were internationals, the working language on the ice, on the game sheets and eventually on this website switched to English.\n\nIt changed how the club recruits: an exchange student with one semester left will still come to an introduction practice, because there is nothing to lose in the language of it.",
     quote:"",
     cap:"The campus of the Technische Hogeschool Twente in 1964. The school became the University of Twente in 1986.",
     img:"assets/technische-hogeschool-twente-en-de-campus-interieur.jpg",
     credit:"Photo: Joop van Bilsen / Anefo, CC0",
     creditUrl:"https://commons.wikimedia.org/wiki/File:Technische_Hogeschool_Twente_en_de_campus_(interieur),_Bestanddeelnr_916-7797.jpg",
     shots:"1",media:"wide"},
    {id:"c8",yr:"2007",nav:"2007–2011",kicker:"2007–2011",
     h:"Chapter to\nbe written",
     lead:"",
     body:"Placeholder: this five-year chapter has no text yet. Add what happened between 2007 and 2011 — the squads, the rinks, the tournaments, the people.",
     quote:"",cap:"",shots:"0",media:"side"},
    {id:"c9",yr:"2012",nav:"2012–2016",kicker:"2012–2016",
     h:"Chapter to\nbe written",
     lead:"",
     body:"Placeholder: this five-year chapter has no text yet. Add what happened between 2012 and 2016 — the squads, the rinks, the tournaments, the people.",
     quote:"",cap:"",shots:"0",media:"side"},
    {id:"c10",yr:"2017",nav:"2017–2021",kicker:"2017–2021",
     h:"Chapter to\nbe written",
     lead:"",
     body:"Placeholder: this five-year chapter has no text yet. Add what happened between 2017 and 2021 — the squads, the rinks, the tournaments, the people.",
     quote:"",cap:"",shots:"0",media:"side"},
    {id:"c4",yr:"2022",nav:"The title",kicker:"March 2026",gold:true,
     h:"Down 3–1\nafter two periods",
     lead:"The first divisional title in forty-four seasons, won in the last twenty minutes of the last game.",
     body:"The Striking Stallions went into the third period of the decisive game a goal short and finished it 4–3, in front of supporters who had travelled with the team.\n\nSlapping Studs 1 finished second in the 6th Division North the same season. It was, by some distance, the best year the club had put together.",
     quote:"",
     cap:"IJsbaan Twente in Enschede, the club's home rink.",
     img:"assets/ijsbaan-twente.jpg",
     credit:"Photo: Tubantia, CC BY-SA 3.0",
     creditUrl:"https://creativecommons.org/licenses/by-sa/3.0",
     shots:"1",media:"side"},
    {id:"c5",yr:"Every April",nav:"Traditions",kicker:"Off-ice",
     h:"What happens\nwhen the rink shuts",
     lead:"The ice goes out in April and the club does not.",
     body:"The Off-Ice Committee runs the calendar through the summer: the night tournament, drinks, the board handover, the trip that gets planned every year and happens most years.\n\nMembers tend to describe the Studs as the fixed point in their week. The hockey is the excuse; the group is the point.",
     quote:"",
     cap:"",
     shots:"0",media:"side"}
  ],

  /* "when" is read as "<number> / <priority>": the number leads
     the row and the priority sits under the name, so keep the
     slash. Each item's photograph lives in images["gear:<id>"]. */
  gear:[
    {id:"ge1",when:"01 / buy first",title:"Skates",body:"The one thing you shouldn't borrow for long. Fit matters more than price; go a full size below your shoe."},
    {id:"ge2",when:"02 / buy first",title:"Helmet + cage",body:"Full cage or visor. Non-negotiable at every level of Dutch competition."},
    {id:"ge3",when:"03 / buy second",title:"Gloves",body:"Protect the hands and let you actually feel the stick. Cheap ones are stiff and you'll hate them."},
    {id:"ge4",when:"04 / buy second",title:"Shoulder & elbow",body:"Boards are hard and so is ice. Shoulder pads, elbow pads, shin guards, hockey pants."},
    {id:"ge5",when:"05 / borrow",title:"Stick",body:"Left or right, flex and curve — borrow until you know what you like. Sticks break."},
    {id:"ge6",when:"06 / rink",title:"Neck guard",body:"Required for students in Dutch competition. Cheap, and worth it."}
  ],

  rules:[
    {id:"r1",n:"01",title:"Offside",body:"The puck crosses the blue line into the attacking zone before you do. Not the other way round."},
    {id:"r2",n:"02",title:"Icing",body:"Shooting the puck from your own half all the way past the opponent's goal line without anyone touching it. Play restarts in your own zone — you gained nothing."},
    {id:"r3",n:"03",title:"Penalties",body:"Two minutes in the box for tripping, hooking, slashing, high sticking. Your team plays a man short and it usually costs a goal."},
    {id:"r4",n:"04",title:"No body checking",body:"In the lower Dutch divisions the game is non-checking. Position and stick work, not shoulders."},
    {id:"r5",n:"05",title:"Changing on the fly",body:"Substitutions happen while play continues. Come off short, come off tired, don't wait for a whistle."},
    {id:"r6",n:"06",title:"Faceoffs",body:"Every stoppage restarts with a faceoff at one of nine dots. Where the dot is depends on what stopped play."}
  ],

  steps:[
    {id:"st1",n:"Step 1",title:"Sign up for an intro practice",body:"Two free introduction practices run each year, usually early in the season. Skates, stick, helmet and full protective gear are provided at the rink — bring nothing but sports clothes."},
    {id:"st2",n:"Step 2",title:"Come to a regular training",body:"Liked it? Join a normal training hour any time during the season. The board puts you in the group that fits your level."},
    {id:"st3",n:"Step 3",title:"Get your Campus Card",body:"We're subsidised by the university, so all members need a UT Campus Card. Not a UT or Saxion student? Still possible — the card costs more."},
    {id:"st4",n:"Step 4",title:"Get your own gear",body:"Once you're staying, you'll want your own skates and protection. We'll tell you what to buy first, what to buy second, and what to borrow for another season."}
  ],

  /* PLACEHOLDER below 2025–26 — invented to show the layout. */
  archive:[
    {id:"a1",season:"2025–26",posts:"18",highlight:"Stallions champions, 5th div. North",tags:"result · season report · event"},
    {id:"a2",season:"2024–25",posts:"23",highlight:"Night tournament returns",tags:"event · rookies"},
    {id:"a3",season:"2023–24",posts:"19",highlight:"Third team enters competition",tags:"club · competition"},
    {id:"a4",season:"2022–23",posts:"21",highlight:"NSK hosted in Enschede",tags:"nsk · event"}
  ],

  /* Membership applications submitted through join.html. The board
     reviews them in the admin console. Seeded with one example
     so the review queue is not empty on a first look. */
  signups:[
    {id:"su1",name:"Example applicant",email:"example@student.utwente.nl",study:"UT student",
     experience:"Never played",session:"Intro practice · 11 October",note:"Can I borrow skates in size 46?",
     date:"03 September 2026",status:"new"}
  ],

  /* ---------------- member area (account.html) -----------------
     SAMPLE DATA for the three demo accounts in js/auth.js (u1 the
     member, u2 the coach, u3 the admin). Everything here is made up
     to show the screens and must come from the club's own records
     on the real site: the travel signups, the member points and the
     replies. "who" is an account id; "ev" is an id in events[].
     Dates are ISO (YYYY-MM-DD) because the screens compute with
     them; the demo "today" is set in js/account.js. */

  /* One row per account: what the member set on their profile.
     avatar = traits for js/avatar.js; empty keys fall back to the
     generated face. photo / roster: "yes" | "no". */
  profiles:[
    {id:"u1",shirt:"M",emergency:"",photo:"yes",roster:"yes",avatar:{}},
    {id:"u2",shirt:"L",emergency:"Marieke Bakker (partner)",photo:"yes",roster:"yes",avatar:{}},
    {id:"u3",shirt:"S",emergency:"",photo:"no",roster:"yes",avatar:{}}
  ],

  /* Training replies. status: "in" | "out". No row = no reply yet. */
  rsvps:[
    {id:"rv2",who:"u1",date:"2026-04-13",status:"in"},
    {id:"rv3",who:"u3",date:"2026-04-08",status:"out"}
  ],

  /* Game and club-event replies. status: "yes" | "no" | "maybe". */
  avail:[
    {id:"av1",who:"u1",ev:"e3",status:"yes"},
    {id:"av2",who:"u3",ev:"e2",status:"maybe"}
  ],

  /* Who is travelling to an away game. One row per person per game.
     name is shown to everyone; who is the account id when the person
     has one. going: "yes" | "no". how: "van" (the club van, nine
     places including the driver) or "car" (their own car). drive:
     "yes" when they can drive the van or a car. */
  travel:[
    {id:"tr0",ev:"e1",who:"u2",name:"Joris Bakker",going:"yes",how:"van",drive:"yes"},
    {id:"tr1",ev:"e1",who:"",name:"Luca Patty",going:"yes",how:"van",drive:"no"},
    {id:"tr2",ev:"e1",who:"",name:"Eva Bramer",going:"yes",how:"van",drive:"yes"},
    {id:"tr3",ev:"e1",who:"",name:"Daniel Simon",going:"yes",how:"van",drive:"no"},
    {id:"tr4",ev:"e1",who:"",name:"Iris Kouwenberg",going:"yes",how:"van",drive:"no"},
    {id:"tr5",ev:"e1",who:"",name:"Branislav Javor",going:"yes",how:"van",drive:"no"},
    {id:"tr6",ev:"e1",who:"",name:"Kim Zwart",going:"yes",how:"car",drive:"yes"},
    {id:"tr7",ev:"e1",who:"",name:"Charlotte van Mourik",going:"yes",how:"car",drive:"yes"}
  ],

  /* Member points: one row per account. value runs from 0 up to the
     maximum in pointsrule. Only the board and coaches change them. */
  points:[
    {id:"pt1",who:"u1",value:"3"},
    {id:"pt2",who:"u2",value:"6"},
    {id:"pt3",who:"u3",value:"8"},
    {id:"pt4",who:"u4",value:"5"}
  ],

  /* One row. need = points a member should have; max = the top of the
     scale. Both are changed in the admin console. */
  pointsrule:[
    {id:"pr1",need:"4",max:"10"}
  ],

  /* Overrides for inline-edited text blocks, keyed by data-ed. */
  copy:{},

  /* Uploaded images, keyed by slot name (hero, news:n1, player:pl01…).
     Values are data URLs written by the in-browser uploader. */
  images:{}
};
