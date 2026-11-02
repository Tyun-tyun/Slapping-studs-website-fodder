/* ============================================================
   auth.js — roles, permissions and the demo accounts.

   IMPORTANT: this is a front-end demonstration of a permission
   model, not security. Every check happens in the browser and
   every password is in this file. It exists so the board can
   see and argue about who should be able to do what BEFORE a
   back end is built. When the real site is built, this file
   becomes the specification, and the checks move to the server.

   Deleting a role: remove it from PERMS and from ACCOUNTS.
   Adding a capability: add it to PERMS and to MATRIX, then gate
   something on it with Studs.can("your.capability").
   ============================================================ */

window.Studs = window.Studs || {};

/* Demo sign-ins. team / no / pos / group place the account in the
   club (squad, jersey, position, training group) for the member
   area; coaches lists the squads a coach looks after there. */
/* Demo sign-ins. The names are invented on purpose — the real
   board members are listed on the contact page, and nobody's
   actual name should sit next to a printed password. */
window.Studs.accounts = [
  {id:"u1", role:"member", name:"Sanne de Vries", sub:"Studs 2 · #14",
   team:"Studs 2", no:"14", pos:"Defence", group:"Groups 4–6",
   email:"member@slappingstuds.nl", pw:"rookie",
   can:["Photo albums for her teams","Full training calendar with addresses","Member contact list","RSVP to events"]},

  {id:"u2", role:"coach", name:"Joris Bakker", sub:"Coach · Stallions + Studs 1",
   team:"", no:"", pos:"", group:"", coaches:["Stallions","Studs 1"],
   email:"coach@slappingstuds.nl", pw:"bench",
   can:["Everything a member sees","Edit rosters and lineups","Publish game sheets and stats"]},

  {id:"u3", role:"admin", name:"Nina Aalders", sub:"Board · Webcom",
   team:"Cadets", no:"", pos:"Forward", group:"Groups 1–3", coaches:["Cadets"],
   email:"admin@slappingstuds.nl", pw:"godmode",
   can:["Everything above","Add, edit and delete every record","Edit any text on any page","Publish and unpublish"]}
];

/* "*" means every capability. Only admin gets it. */
window.Studs.perms = {
  guest:  ["view.public"],

  member: ["view.public","view.gallery","view.calendar","view.contacts",
           "event.rsvp","album.upload","account.view"],

  coach:  ["view.public","view.gallery","view.calendar","view.contacts",
           "event.rsvp","album.upload","account.view",
           "view.coachalbums","roster.edit","stats.publish"],

  admin:  ["*"]
};

