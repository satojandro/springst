/* Policy data for Spring St Blind Date.
   Read docs/EDITORIAL.md before changing anything in this file.
   Every option must be traceable to a source listed in docs/DATA.md. */

const PARTIES = {
  L:{name:"Labor", long:"Labor (Ben Carroll)"},
  C:{name:"Liberal–Nationals", long:"Liberal–Nationals Coalition (Jess Wilson)"},
  G:{name:"Greens", long:"The Greens"},
  O:{name:"One Nation", long:"One Nation"},
  VS:{name:"Victorian Socialists", minor:true, where:"All 88 districts + every upper house region"},
  SA:{name:"Socialist Alliance", minor:true, where:"6 districts around Geelong & Melbourne's north + 2 upper house regions"},
  LB:{name:"Libertarian Party", minor:true, where:"23 districts + 3 upper house regions"},
  FF:{name:"Family First", minor:true, where:"About 70 districts + 6 upper house regions"},
  AJ:{name:"Animal Justice Party", minor:true, where:"40 districts + 2 upper house regions"},
  LC:{name:"Legalise Cannabis", minor:true, where:"5 south-east districts + every upper house region"},
  SFF:{name:"Shooters, Fishers & Farmers", minor:true, where:"Gippsland East, Ripon + 3 upper house regions"},
  SUS:{name:"Sustainable Australia", minor:true, where:"Upper house only (all 8 regions)"},
  CIT:{name:"Australian Citizens Party", minor:true, where:"4 districts + 2 upper house regions"},
  DEM:{name:"Australian Democrats", minor:true, where:"Lowan, Richmond + 6 upper house regions"},
  WEST:{name:"The West Party", minor:true, where:"12 western-suburbs districts + Western Metro"}
};
const MAJORS = ["L","C","G","O"];
const ELECTION = new Date("2026-11-28T08:00:00+11:00");
const MINOR_EXPLAINER = {t:"The minor parties running in the 2026 Victorian election", u:"https://www.abc.net.au/news/2026-11-14/victoria-2026-state-election-independent-party-explainer/107342014", s:"ABC News · explainer", lean:"neutral", l:"Neutral"};
const TRACKER = {t:"ABC News: Every key policy promise, tracked", u:"https://www.abc.net.au/news/2026-11-04/victoria-2026-election-policy-promise-tracker/107247200", s:"ABC News · live tracker", lean:"neutral", l:"Neutral"};
const PBO = {t:"Parliamentary Budget Office: election commitment costings", u:"https://pbo.vic.gov.au/2026_election_commitment_tracker", s:"Vic PBO · independent costings", lean:"official", l:"Official"};
const yt = q => ({t:`YouTube: “${q}”`, u:"https://www.youtube.com/results?search_query="+encodeURIComponent(q), s:"Video explainers, debates & vlogs, all leanings", lean:"search", l:"Search"});

const AREAS = [
{ id:"energy", title:"Keeping the lights on", tag:"Energy & climate",
  sub:"Power bills, gas in your kitchen, new powerlines across the countryside. Which plan feels right?",
  context:"Victoria is phasing out coal power. The fight is over how fast, and what replaces it: gas, renewables plus big transmission lines, or something else.",
  opts:{
    L:{h:"Stay the course on renewables", b:["Keep net zero by 2045 and keep moving homes off gas","Keep building the big new transmission lines, with an independent cost check on the western link","$500m of mining royalties directed to regional Victoria"]},
    C:{h:"More gas, fewer powerlines", b:["Keep the 2045 net zero law, but scrap the ban on gas in new homes","Open up new gas projects","Cancel the VNI West interconnector and pause the western link for review","2km buffer between wind turbines and homes; solar on commercial rooftops"]},
    G:{h:"Go big and go public", b:["$2b for public solar on schools, public housing and government buildings","Close the Loy Yang A coal plant early","Block new fossil fuel projects, including a proposed Geelong gas import terminal","$1b fund for climate adaptation"]},
    O:{h:"Scrap net zero, open the door to nuclear", b:["Scrap net zero targets and subsidies","Lift the state ban on nuclear power","Cancel VNI West and other big transmission projects","Bring back gas in new homes and back offshore gas"]}
  },
  res:[
    {t:"Power struggle: the energy supply election question", u:"https://www.canberratimes.com.au/story/9388684/power-struggle-the-energy-supply-election-question/", s:"AAP via Canberra Times", lean:"neutral", l:"Neutral"},
    {t:"Changing tack on Victoria's energy transition will throw savings into reverse, experts warn", u:"https://reneweconomy.com.au/changing-tack-on-victorias-energy-transition-will-throw-electricity-savings-into-reverse-experts-warn/amp/", s:"RenewEconomy · clean-energy trade site", lean:"left", l:"Leans left"},
    {t:"More gas, fewer poles and wires: our plan to keep the lights on", u:"https://vic.nationals.org.au/media-releases/danny-obrien-mp-more-gas-fewer-poles-and-wires-our-plan-to-keep-the-lights-on-and-prices-low/", s:"Nationals media release · party source", lean:"right", l:"Leans right"},
    yt("Victorian election 2026 energy gas renewables")
  ],
  live:"(energy OR gas OR renewables OR \"net zero\") (#springst OR #vicpol OR \"Victorian election\")"
},
{ id:"housing", title:"Rent, mortgages and where new homes go", tag:"Housing",
  sub:"Can you afford to rent, buy, or stay where you are? Pick the approach you'd back.",
  context:"Victoria has a big housing shortfall. Plans differ on building up in existing suburbs, public housing, rent controls and taxes.",
  opts:{
    L:{h:"Build up near trains and shops", b:["25,600 new homes reserved for first home buyers at market prices, from 2027","300,000+ homes by 2051, incl. apartments up to 20 storeys in some inner suburbs","Extra $860m into social housing","Roll back recent land tax changes over six years"]},
    C:{h:"Local say and stamp duty relief", b:["Scrap the high-rise 'activity centre' plan and give locals more say","No stamp duty for first home buyers on homes up to $1m","Focus growth on inner precincts like Fishermans Bend, Fitzroy and Collingwood","Return land tax thresholds to 2023 levels"]},
    G:{h:"Rent freeze and lots of public housing", b:["$4b towards 88,000 new public homes","Freeze rents for two years, then cap rises to wages or inflation","Landlord licensing and an independent rental regulator","No stamp duty under $1.1m; replace auctions with fixed-price sales"]},
    O:{h:"Cut the costs of building", b:["Cut government fees and charges on new homes","Raise stamp duty for foreign buyers","Make granny flats and spare-room renting easier","Community consultation required before high-rise in established suburbs"]}
  },
  res:[
    {t:"Victoria State Election 2026: which housing policies are the best?", u:"https://ufinancial.com.au/victoria-state-election-2026-which-major-partys-housing-policies-are-the-best/", s:"UFinancial · mortgage broker blog", lean:"search", l:"Blog"},
    {t:"Election Connection 2026: guide to the Victorian policy landscape", u:"https://www.propertycouncil.com.au/submissions/vic-election-connection-2026", s:"Property Council · developer lobby", lean:"advocacy", l:"Industry"},
    {t:"Fastest rent hikes in Australia show why Victoria needs rent caps", u:"https://greens.org.au/vic/news/media-release/fastest-rent-hikes-australia-show-why-victoria-needs-rent-caps-saving", s:"Greens media release · party source", lean:"left", l:"Leans left"},
    {t:"Victoria's election-year rental market reckoning", u:"https://reiv.com.au/our-industry/news/victoria-s-election-year-rental-market-reckoning-time-is-running-out-to-bring-renters-in-from-the-cold", s:"Real Estate Institute of Victoria · landlord/agent lobby", lean:"advocacy", l:"Industry"},
    yt("Victoria housing crisis 2026 election")
  ],
  live:"(rent OR housing OR \"stamp duty\" OR \"activity centres\") (#springst OR \"Victorian election\")"
},
{ id:"crime", title:"Feeling safe", tag:"Crime, bail & youth justice",
  sub:"Crime is a hot topic this election. What's your approach: more police, tougher bail, prevention, or a mix?",
  context:"Victoria tightened bail laws in 2025. The age of criminal responsibility is currently 12. Experts disagree on whether tougher penalties reduce youth offending.",
  opts:{
    L:{h:"Tough bail, more cops, longer sentences", b:["1,500 more police and a second police academy in Wyndham","Keep the tougher bail laws already in force","Max life for rape; standard 30 years for murdering a partner","$170m permanent organised-crime unit"]},
    C:{h:"Lots more police and 'one strike' bail", b:["3,000 more police and reopen 40+ police stations","Protective services officers at train stations and big shopping centres","'One strike' bail rule for anyone who offends on bail","Adult sentencing for youths on 20 serious offences; $100m for early intervention"]},
    G:{h:"Prevention over prisons", b:["$1b office for community safety and crime prevention","Reverse the 2025 bail tightening","Raise the age of criminal responsibility to 14; no life sentences for children","Decriminalise small amounts of drugs for personal use"]},
    O:{h:"Adult time, parents pay", b:["Kids charged with serious violent crimes tried as adults","Age of criminal responsibility back to 10","Parents liable for fines and damage caused by their kids","24/7 bail court, three new magistrates' courts, UK-style self-defence laws"]}
  },
  res:[
    {t:"'No evidential base' for youth crackdown as poll looms", u:"https://aapnews.aap.com.au/news/no-evidential-base-for-youth-crackdown-as-poll-looms", s:"AAP · newswire", lean:"neutral", l:"Neutral"},
    {t:"'Punishing trauma': experts say proposal could have the opposite effect", u:"https://www.sbs.com.au/news/article/victoria-jail-plan-young-offenders/otrb671kk", s:"SBS News", lean:"neutral", l:"Neutral"},
    {t:"Crime is going in a new direction: down", u:"https://www.premier.vic.gov.au/crime-going-new-direction-down", s:"Premier's office · government source", lean:"official", l:"Govt claim"},
    {t:"Plan to jail even more children won't reduce youth crime", u:"https://jss.org.au/news-and-media/media-releases/plan-to-jail-even-more-children-wont-reduce-youth-crime/", s:"Jesuit Social Services · advocacy", lean:"left", l:"Leans left"},
    {t:"Vital vote in Victoria: a guide to the Victorian election", u:"https://dailydeclaration.org.au/2026/11/10/vital-vote-in-victoria/", s:"The Daily Declaration · Christian conservative", lean:"right", l:"Leans right"},
    yt("Victoria youth crime bail laws 2026")
  ],
  live:"(crime OR bail OR \"youth crime\") (#springst OR \"Victorian election\" OR Victoria)"
},
{ id:"transport", title:"Getting around", tag:"Transport & the Suburban Rail Loop",
  sub:"Trains, trams, potholes and one very expensive tunnel. Where should the money go?",
  context:"The Suburban Rail Loop (SRL) East is estimated at about $32 billion. Contracts are already signed for early works and tunnelling.",
  opts:{
    L:{h:"Keep the Rail Loop, trimmed", b:["Keep building the SRL, cutting about $2b of extras like station car parks","25 new trains to replace old ones on two northern lines","Buses every 10 minutes on key western routes","$352m to double pothole repairs this year"]},
    C:{h:"Pause the Rail Loop, fix the roads", b:["Pause the SRL and review it","$1.7b for 25 hybrid trains on the Melton and Wyndham Vale lines","$5b road repair push targeting one million potholes","Big outer-suburb road duplications"]},
    G:{h:"Free, frequent public transport", b:["Make public transport free, permanently","Trains and trams every 10 minutes, 7am–10pm","Electrify the Melton line; back a second metro tunnel","30km/h on residential streets; 5% of transport budget to bike paths"]},
    O:{h:"Cancel the Rail Loop, redirect it", b:["Cancel the SRL","Put the money into electrifying the Melton line","Finish the Airport Rail Link","Locked-in regional road funding and a public pothole portal"]}
  },
  res:[
    {t:"Ben Carroll cuts $2b from Melbourne mega rail project", u:"https://thenightly.com.au/politics/suburban-rail-loop-ben-carroll-cuts-2b-from-melbourne-mega-rail-project-ahead-of-victorian-election-c-22771560", s:"The Nightly · Seven West Media", lean:"right", l:"Leans right"},
    {t:"Door ajar for rail loop rethink as premier finds feet", u:"https://www.canberratimes.com.au/story/9319538/door-ajar-for-rail-loop-rethink-as-premier-finds-feet/", s:"AAP via Canberra Times", lean:"neutral", l:"Neutral"},
    {t:"Calls for premier's rail pet project to be cancelled", u:"https://aapnews.aap.com.au/news/calls-for-premier-s-rail-pet-project-to-be-cancelled", s:"AAP · newswire", lean:"neutral", l:"Neutral"},
    {t:"PBO costing: cancelling the SRL (PDF)", u:"https://static.pbo.vic.gov.au/files/PBO%20costing-Cancel%20the%20SRL%20debt%20bomb.pdf", s:"Vic Parliamentary Budget Office", lean:"official", l:"Official"},
    yt("Suburban Rail Loop explained")
  ],
  live:"(\"Suburban Rail Loop\" OR SRL OR \"public transport\") (#springst OR Melbourne)"
},
{ id:"health", title:"When you need a doctor", tag:"Health",
  sub:"Hospitals, waitlists, dental and drugs policy. What should come first?",
  context:"Elective surgery waitlists are long, and public dental care in Victoria is limited. Free abortion care has support from both major parties.",
  opts:{
    L:{h:"Dental clinics and suburban hospitals", b:["$230m for 10 free public dental clinics","New and expanded emergency departments in growth suburbs","More maternity beds in Melbourne's west","Free abortion care"]},
    C:{h:"Clear the surgery queue", b:["$1.27b for 25,000 extra elective surgeries a year","Pay for it by scrapping a state innovation investment fund","Big regional hospital builds (West Gippsland $850m, Wonthaggi $350m)","New youth mental health facility; free abortion care"]},
    G:{h:"Free dental for everyone", b:["$3b for 20 public dental clinics and free dental for all","Lock in 5% of the health budget for prevention","Free abortion and contraception","Legalise cannabis; expand pill testing and supervised injecting rooms"]},
    O:{h:"Less admin, more frontline", b:["Cut hospital admin and DEI programs to fund frontline care","Guaranteed 24/7 emergency departments in the regions","Let nurses prescribe and discharge patients","Support payments for families having a baby"]}
  },
  res:[
    {t:"2026 Victorian election commitment tracker", u:"https://seniorsrights.org.au/policy/publication/2026-victorian-state-election-commitment-tracker/", s:"Seniors Rights Victoria · advocacy", lean:"advocacy", l:"Advocacy"},
    yt("Victoria hospital waitlist 2026"),
    yt("Victorian election 2026 health debate")
  ],
  live:"(hospital OR health OR dental OR ambulance) (#springst OR \"Victorian election\")"
},
{ id:"cost", title:"Your wallet", tag:"Cost of living & tax",
  sub:"Everyone says they'll make life cheaper. Who pays, and who saves?",
  context:"Victoria leans heavily on property taxes. Several plans either cut taxes or raise new ones from big businesses.",
  opts:{
    L:{h:"Caps on fares and tolls", b:["$30 weekly cap on public transport fares for two years","$30 weekly toll cap for smaller vehicles","Free school uniforms and breakfasts for families doing it tough","Builds on current fare and rego discounts"]},
    C:{h:"No new taxes, cut existing ones", b:["Pledge of no new or increased taxes","Scrap the emergency services levy on family homes and the short-stay levy","Cut payroll tax; $50 weekly toll cap","Target a cash surplus by 2032"]},
    G:{h:"Make big business pay", b:["0.1% quarterly levy on the big five banks (over $3b a year)","Pokies tax to 75%; wealth tax on investors with $5m+ in property","$500m in vouchers for solar, batteries and insulation","Up to $3,000 off EVs and e-bikes; paid sick leave for casuals"]},
    O:{h:"Cut taxes across the board", b:["Repeal recent land tax increases","Abolish the 10% stamp duty on home, contents and car insurance","Lift payroll tax threshold for small business","$150 sports vouchers per school-age kid"]}
  },
  res:[
    {t:"Victorian election 2026: party policies compared", u:"https://stplnews.com.au/political-news/victorian-election-2026-party-policies-peninsula/", s:"STPL News · local news", lean:"neutral", l:"Local"},
    {t:"2026 Victorian election commitment tracker", u:"https://seniorsrights.org.au/policy/publication/2026-victorian-state-election-commitment-tracker/", s:"Seniors Rights Victoria · advocacy", lean:"advocacy", l:"Advocacy"},
    yt("Victoria cost of living election 2026")
  ],
  live:"(\"cost of living\" OR tolls OR \"land tax\" OR \"payroll tax\") (#springst OR Victoria)"
},
{ id:"schools", title:"Schools and skills", tag:"Education & training",
  sub:"From prep to TAFE to uni. What would make the biggest difference?",
  context:"State governments run public schools, the VCE and TAFE. Universities are mostly federally funded but set up under state law.",
  opts:{
    L:{h:"Fix VCE, train electricians", b:["$222m to overhaul the body that runs the VCE and curriculum","State-owned apprenticeship academy: 2,000 electrical apprentices over four years","School upgrades in growth areas"]},
    C:{h:"Selective schools and tech schools", b:["Three new selective-entry high schools; six more partly selective","$222m for 10 new technical schools (up to 5,000 students)","Pay half of apprentices' off-the-job training costs","Classroom behaviour reforms; cut teacher workload"]},
    G:{h:"Free means free", b:["End 'voluntary' parent contributions so public school is actually free","Free university","Cap vice-chancellor pay; students and staff on uni councils"]},
    O:{h:"Back to basics, money follows the kid", b:["Replace the curriculum with a 'knowledge-rich' literacy, numeracy, science, history and civics syllabus","School vouchers","More trade schools; easier to open independent schools"]}
  },
  res:[ yt("Victoria schools VCE 2026 election"), yt("school voucher system explained") ],
  live:"(schools OR teachers OR VCE OR TAFE) (#springst OR \"Victorian election\")"
},
{ id:"treaty", title:"Treaty and First Peoples", tag:"Indigenous affairs",
  sub:"Victoria signed Australia's first statewide Treaty with First Peoples. What should happen next?",
  context:"The Treaty created an elected First Peoples' body with a role in decisions affecting Aboriginal Victorians. Its future is a clear dividing line this election.",
  opts:{
    L:{h:"Keep the Treaty and fund it", b:["Keep the Treaty","About $170m over four years for First Peoples' programs","Koori hearing list in Melbourne Magistrates' Court","First Nations housing, including rent-to-buy homes"]},
    C:{h:"Repeal it, run it through a department", b:["Repeal the Treaty laws within 100 days","Indigenous policy back in a department with a minister and an advisory body","Redirects about $1b over 10 years","$52m for urgent care through 16 Aboriginal community health organisations"]},
    G:{h:"Keep it and go further", b:["Keep the Treaty; support more local and statewide treaties","Traditional Owners managing national and state parks","$2b nature protection fund linked to First Nations land care"]},
    O:{h:"Scrap it and redirect the money", b:["Scrap the Treaty","Abolish the elected First Peoples' body","Redirect its yearly funding to other services"]}
  },
  res:[
    {t:"Victorian Coalition pledges to tear up Treaty laws if elected", u:"https://www.sbs.com.au/nitv/article/victorian-coalition-pledges-to-tear-up-treaty-laws-if-elected-in-2026/p31zs17d5", s:"SBS NITV", lean:"neutral", l:"Neutral"},
    {t:"Treaty on election ballot as opposition vows tear-down", u:"https://aapnews.aap.com.au/news/treaty-on-election-ballot-as-opposition-vow-tear-down", s:"AAP · newswire", lean:"neutral", l:"Neutral"},
    {t:"Victorian election: what's at stake for Treaty and self-determination?", u:"https://nit.com.au/30-10-2026/27249/victorian-state-election-whats-at-stake-for-treaty-and-indigenous-selfdetermination", s:"National Indigenous Times", lean:"left", l:"Leans left"},
    {t:"Vital vote in Victoria: a guide to the Victorian election", u:"https://dailydeclaration.org.au/2026/11/10/vital-vote-in-victoria/", s:"The Daily Declaration · Christian conservative", lean:"right", l:"Leans right"},
    yt("Victoria Treaty explained")
  ],
  live:"(Treaty OR \"First Peoples\") (Victoria OR #springst)"
},
{ id:"budget", title:"The credit card bill", tag:"State debt & spending",
  sub:"Victoria's net debt is forecast to reach about $199b by 2029–30. How should it be handled?",
  context:"The May 2026 budget showed a small operating surplus, but a cash deficit once infrastructure spending is counted. Ratings agencies have warned about rising interest costs.",
  opts:{
    L:{h:"Trim the big projects, cut consultants", b:["Fund promises from about $2b of Rail Loop savings","Cut $70m in consultants and non-essential spending","Wind up or merge several government agencies"]},
    C:{h:"Freeze hiring, shrink the public service", b:["Public service hiring freeze until staffing returns to 2014–15 levels per person","Cap executive pay; claims $22b saved over 10 years","Sell the Melbourne wholesale fruit and veg market ($578m)","Aim for a cash surplus by 2032"]},
    G:{h:"Raise revenue, don't cut services", b:["Bank levy, higher gambling taxes and a property wealth tax","3% tax on vacant commercial properties in Melbourne","Spend it on public housing, health and transport"]},
    O:{h:"Cancel the big project, audit everything", b:["Cancel the Rail Loop","Sunset reviews of every government body (about $35b a year of spending)","Cut bureaucracy, DEI and ESG programs"]}
  },
  res:[
    {t:"'Downside risks': warning as state debt edges to $200b", u:"https://www.canberratimes.com.au/story/9239306/downside-risks-warning-as-state-debt-edges-to-200b/", s:"AAP via Canberra Times", lean:"neutral", l:"Neutral"},
    {t:"Victoria's high debt future: a budget built on stabilisation, not repair", u:"https://neoskosmos.com/en/2026/05/12/news/victorias-high-debt-future-a-budget-built-on-stabilisation-not-repair/", s:"Neos Kosmos · community news", lean:"neutral", l:"Neutral"},
    {t:"Victorians drown in bureaucrats and debt", u:"https://www.macrobusiness.com.au/2026/03/victorians-drown-in-bureaucrats-and-debt/", s:"MacroBusiness · independent econ blog", lean:"right", l:"Leans right"},
    yt("Victoria state debt explained 2026")
  ],
  live:"(\"state debt\" OR budget) (Victoria OR #springst)"
}
];

/* Smaller parties: positions from the ABC minor parties explainer (14–15 Nov 2026). */
const MINOR = {
  energy:{
    SA:{h:"Fossil fuels out by 2035", b:["Phase out all fossil fuels by 2035","End every fossil fuel subsidy and tax break","Moratorium on new data centres"]},
    LB:{h:"Ditch net zero, any power goes", b:["Remove net zero targets","Green-light nuclear and coal power projects","Small government: candidates pledge never to vote for a tax rise"]},
    CIT:{h:"Every watt through a public company", b:["All electricity sold through a State Electricity Commission","Outlaw the sale of state assets"]}
  },
  housing:{
    VS:{h:"Five-year rent freeze", b:["Freeze rents for five years","Build 150,000 new public homes"]},
    SUS:{h:"Slow growth, cheaper homes", b:["Lower rents and more social housing","Abolish stamp duty","Slower migration to ease demand"]},
    LB:{h:"Get out of the way and let people build", b:["Scrap stamp duty","Scrap zoning restrictions"]}
  },
  crime:{
    VS:{h:"Defund and disarm", b:["Reverse a decade of police funding increases and redirect it to social welfare","Disarm police on patrol","Raise the age of criminal responsibility to 16"]},
    DEM:{h:"Prevention hubs", b:["Safety and Prevention Hubs in 10 key areas","An independent authority to oversee major projects and fight corruption"]},
    WEST:{h:"Tougher on repeat offenders, plus prevention", b:["Harsher penalties for repeat retail and street crime offenders","More investment in prevention","Focused on Melbourne's western suburbs"]}
  },
  transport:{
    SA:{h:"Free public transport", b:["Make public transport free","Pay for it by ending fossil fuel subsidies"]},
    WEST:{h:"Fix the west first", b:["More road and public transport money for the western suburbs","Infrastructure delivered before new homes are planned and built"]},
    LB:{h:"Cancel the Rail Loop, cut taxes", b:["Cancel the Suburban Rail Loop","Scrap stamp duty and payroll tax"]}
  },
  health:{
    LC:{h:"Legalise cannabis", b:["Legalise cannabis for adults","Grow the hemp industry"]},
    AJ:{h:"Treat processed meat like tobacco", b:["Health warnings and a tax on processed meat; no sales to minors","Subsidies for vet care; no GST on vet bills"]},
    FF:{h:"Faith-based family values", b:["Repeal voluntary assisted dying (euthanasia) laws","Ban surrogacy and egg and sperm donation","Phase out poker machines"]}
  },
  cost:{
    VS:{h:"Tax billionaires, lift wages", b:["Wealth tax on billionaires and luxury properties","Double payroll tax for large companies","$35 minimum hourly wage on government-funded work","Free childcare five days a week"]},
    LB:{h:"Abolish the big state taxes", b:["Scrap stamp duty and payroll tax","Never vote for a tax increase"]},
    FF:{h:"Tax cuts for families", b:["Tax cuts for families and married couples","Phase out poker machines"]}
  },
  schools:{
    VS:{h:"Free childcare, state-run", b:["Expand state-run early learning and childcare centres","Free childcare five days a week"]}
  },
  treaty:{
    SA:{h:"Back the Treaty", b:["Support the Treaty with First Peoples"]},
    FF:{h:"Scrap the Treaty", b:["Scrap the Treaty with First Peoples"]}
  },
  budget:{
    DEM:{h:"Clean up how projects get built", b:["Independent infrastructure authority to oversee major projects and crack down on corruption","Upper house elected statewide by proportional representation"]},
    SA:{h:"Politicians on an average wage", b:["MPs take an average worker's wage and give the rest to campaigns","Remove the wage cap on public sector workers"]}
  }
};
AREAS.splice(8, 0, { id:"bush", title:"Animals, hunting and the bush", tag:"Animals & the bush",
  sub:"Duck hunting, logging, racing and your dog at the pub. Where do you land?",
  context:"Native forest logging in Victoria's state forests ended in 2024. Duck hunting, greyhound racing and gun laws still divide people, especially in the regions.",
  opts:{
    L:{h:"Back the races, dogs at the pub", b:["$80m for the racing industry fund, including horse and greyhound racing","Change food laws to let dogs inside pubs","2km buffer between new waste-to-energy plants and homes"]},
    C:{h:"Timber, burns and fire trucks", b:["Native timber processed at Victorian sawmills","Double planned burns to cut fuel loads in public forests","$200m for 335 fire trucks and 17 CFA stations"]},
    G:{h:"Protect wildlife and forests", b:["Ban native forest logging and duck hunting","Ban greyhound and jumps racing","Traditional Owners managing national and state parks"]},
    O:{h:"Hunters welcome, pests out", b:["Support duck and deer hunting","Eradicate European carp and redfin","No new batteries or data centres on farmland"]},
    AJ:{h:"End animal farming", b:["Phase out animal farming: ban factory farming, aquaculture and live export","Ban duck hunting, puppy and kitten farms and fur sales","Subsidised vet care"]},
    SFF:{h:"Hunting, fishing, guns", b:["Protect duck hunting; expand hound hunting and bow hunting for carp","Repeal the 2026 firearms licence changes","Bring back a sustainable native timber industry; scrap the emergency services levy"]}
  },
  res:[
    {t:"The minor parties running in the 2026 Victorian election", u:MINOR_EXPLAINER.u, s:"ABC News · explainer", lean:"neutral", l:"Neutral"},
    yt("Victoria duck hunting debate"), yt("Victoria native logging end explained")
  ],
  live:"(\"duck hunting\" OR greyhound OR logging OR firearms) (Victoria OR #springst)"
});
for(const a of AREAS){ const m = MINOR[a.id]; if(m) Object.assign(a.opts, m); }
const minorsOf = a => Object.keys(a.opts).filter(k=>!MAJORS.includes(k));


