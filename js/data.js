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
     shows in the feed with a DRAFT pill. */
  news:[
    {id:"n1",title:"End of season '25–'26",date:"22 April 2026",tag:"Season report",author:"Charlotte van Mourik",
     excerpt:"All Studs teams have shown hard work and dedication. Team 1 second in the North 6th Division, Team 2 sixth, and the Striking Stallions champions of the 5th Division North.",status:"published"},
    {id:"n2",title:"Champions of the North, 5th Division",date:"24 March 2026",tag:"Result",author:"Charlotte van Mourik",
     excerpt:"Congratulations to the Striking Stallions. The battle isn't over yet — the 5th division championship game follows in Leiden.",status:"published"},
    {id:"n3",title:"Night tournament sign-up is open",date:"02 March 2026",tag:"Event",author:"Off-Ice Committee",
     excerpt:"Hockey and a party, straight through the night at IJsbaan Twente. Teams of six, mixed levels, rookies encouraged.",status:"published"},
    {id:"n4",title:"Two free introduction practices",date:"11 October 2025",tag:"Join us",author:"Board",
     excerpt:"Skates, stick and full gear provided. You need nothing but a pair of gloves and the willingness to fall over in front of strangers.",status:"published"},
    {id:"n5",title:"Board handover 2026–27",date:"01 May 2026",tag:"Club",author:"Board",
     excerpt:"Draft announcement of next season's board. Not published yet — visible to admins only, with a DRAFT pill on the feed.",status:"draft"}
  ],

  /* kind: "home" | "away" | "" (no badge) */
  events:[
    {id:"e1",dd:"12",mm:"Apr",title:"Championship final · 5th div.",meta:"09:00 · Leiden",kind:"away"},
    {id:"e2",dd:"18",mm:"Apr",title:"Studs 2 vs. Enschede Lions",meta:"21:15 · IJsbaan Twente",kind:"home"},
    {id:"e3",dd:"26",mm:"Apr",title:"Night tournament",meta:"20:00 → 04:00 · IJsbaan Twente",kind:""},
    {id:"e4",dd:"09",mm:"May",title:"End-of-season BBQ",meta:"17:00 · Sportcentrum UT",kind:""},
    {id:"e5",dd:"24",mm:"Aug",title:"Kick-In · Studs stand",meta:"All day · Campus UT",kind:""}
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

  comps:[
    {id:"c1",title:"Fifth division North",body:"Striking Stallions. Slapstick Flyers Heerenveen, Leiden Blues, Leiden Key Town Tigers, Loki Amsterdam, OG Capitals Leeuwarden 5, Blue Mountain Cougars Hoorn 2, Gijs Groningen 4."},
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

  /* PARTLY PLACEHOLDER — 1982, 2026 and "Today" are real.
     The 1990s / 2010 / 2018 markers are invented structure and
     must be replaced from the club archive before launch. */
  timeline:[
    {id:"t1",yr:"1982",lb:"Founded",body:"A group of University of Twente students goes looking for some action and finds it on the ice. The club is affiliated with the university from day one."},
    {id:"t2",yr:"1990s",lb:"Home ice",body:"IJsbaan Twente becomes the permanent home rink. Season shape settles into October–March, ice out April to October."},
    {id:"t3",yr:"2010",lb:"Second team",body:"Numbers outgrow one squad. Studs 1 and Studs 2 enter competition separately; the ice is split into training groups by level."},
    {id:"t4",yr:"2018",lb:"English on the ice",body:"International students pass a quarter of the membership. Practices, game sheets and the website switch to English as the working language."},
    {id:"t5",yr:"2026",lb:"First title",body:"The Striking Stallions take the 5th Division North. Studs 1 finish second in the 6th Division North the same season."},
    {id:"t6",yr:"Today",lb:"Four squads",body:"50+ members across Studs 1, Studs 2, the Striking Stallions and the Cadets, one coach, and an Off-Ice Committee that keeps the calendar full when the rink is closed."}
  ],

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

  /* Membership applications submitted through #/join. The board
     reviews them in the admin console. Seeded with one example
     so the review queue is not empty on a first look. */
  signups:[
    {id:"su1",name:"Example applicant",email:"example@student.utwente.nl",study:"UT student",
     experience:"Never played",session:"Intro practice · 11 October",note:"Can I borrow skates in size 46?",
     date:"03 September 2026",status:"new"}
  ],

  /* Overrides for inline-edited text blocks, keyed by data-ed. */
  copy:{},

  /* Uploaded images, keyed by slot name (hero, news:n1, player:pl01…).
     Values are data URLs written by the in-browser uploader. */
  images:{}
};
