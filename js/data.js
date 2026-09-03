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
    {id:"s4",k:"Members",v:"50+",n:"3 teams · 25% international"}
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

  /* PLACEHOLDER — real names, numbers and figures needed.
     gp/g/a/pim feed the scoring table; points are computed. */
  players:[
    {id:"p1",no:"17",name:"Player name",pos:"Forward",team:"Stallions",gp:14,g:18,a:11,pim:6},
    {id:"p2",no:"4", name:"Player name",pos:"Defence",team:"Stallions",gp:13,g:3, a:15,pim:22},
    {id:"p3",no:"31",name:"Player name",pos:"Goaltender",team:"Studs 1",gp:12,g:0,a:1, pim:0},
    {id:"p4",no:"9", name:"Player name",pos:"Forward",team:"Studs 1",gp:14,g:12,a:14,pim:10},
    {id:"p5",no:"22",name:"Player name",pos:"Defence",team:"Studs 2",gp:14,g:2, a:9, pim:14},
    {id:"p6",no:"88",name:"Player name",pos:"Forward",team:"Studs 2",gp:11,g:7, a:5, pim:4}
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

  comps:[
    {id:"c1",title:"Fifth division North",body:"Striking Stallions. Slapstick Flyers Heerenveen, Leiden Blues, Leiden Key Town Tigers, Loki Amsterdam, OG Capitals Leeuwarden 5, Blue Mountain Cougars Hoorn 2, Gijs Groningen 4."},
    {id:"c2",title:"Sixth division North",body:"Slapping Studs 1 and 2. HELA Amsterdam, Blue Mountain Cougars Hoorn 3, OG Capitals Leeuwarden 6, Enschede Lions, Zoetermeer Wild Panters — and each other."},
    {id:"c3",title:"NSK",body:"The Dutch Student Championship closes the season: a two-day event hosted by a different student ice hockey team each year."},
    {id:"c4",title:"Night tournament",body:"Our own end-of-season tournament at IJsbaan Twente. Hockey and a party, played into the night."}
  ],

  /* vis: "public" | "member" | "coach" — drives who sees the album */
  albums:[
    {id:"al1",title:"Stallions — championship night",meta:"22 March 2026 · 148 photos",vis:"member"},
    {id:"al2",title:"Night tournament '26",meta:"26 April 2026 · 312 photos",vis:"member"},
    {id:"al3",title:"NSK weekend",meta:"Two days · 204 photos",vis:"member"},
    {id:"al4",title:"Kick-In promo",meta:"August 2025 · 61 photos",vis:"public"},
    {id:"al5",title:"Coach film — powerplay drills",meta:"Internal · 24 clips",vis:"coach"}
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
    {id:"t6",yr:"Today",lb:"Three teams",body:"50+ members, one coach, a rookie group every autumn and an Off-Ice Committee that keeps the calendar full when the rink is closed."}
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
    {id:"st2",n:"Step 2",title:"Come to a regular training",body:"Liked it? Join a normal training hour any time during the season. Mail a board member and we'll put you in the right group."},
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

  /* Overrides for inline-edited text blocks, keyed by the
     data-ed attribute in index.html. Starts empty; the admin
     fills it by editing on the page. */
  copy:{}
};
