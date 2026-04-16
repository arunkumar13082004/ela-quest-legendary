export const GATE_META = {
  1: {
    id: 1,
    name: "Vocabulary Forest",
    worldName: "Verdant Wordwoods",
    standard: "CCSS.ELA-LITERACY.L.5.4",
    summary: "Use context clues to choose the meaning of unknown words.",
    guardian: "Moss Wyrm",
    themeColor: 0x4caf7a
  },
  2: {
    id: 2,
    name: "Main Idea City",
    worldName: "Detective District",
    standard: "CCSS.ELA-LITERACY.RI.5.2",
    summary: "Determine main idea and match key supporting details.",
    guardian: "Case Clockwork",
    themeColor: 0x4b8df8
  },
  3: {
    id: 3,
    name: "Figurative Language Arena",
    worldName: "Rune Coliseum",
    standard: "CCSS.ELA-LITERACY.L.5.5",
    summary: "Identify similes, metaphors, idioms, and figurative meaning.",
    guardian: "Echo Beast",
    themeColor: 0xf7934c
  },
  4: {
    id: 4,
    name: "Story Builder Kingdom",
    worldName: "Plotline Citadel",
    standard: "CCSS.ELA-LITERACY.RL.5.3",
    summary: "Sequence narrative events and understand story structure.",
    guardian: "Chronicle Sphinx",
    themeColor: 0xb382f8
  },
  5: {
    id: 5,
    name: "Evidence Mountain",
    worldName: "Summit of Proof",
    standard: "CCSS.ELA-LITERACY.RI.5.1",
    summary: "Quote accurate evidence to support answers and claims.",
    guardian: "Granite Judge",
    themeColor: 0xe06262
  }
};

const vocabRaw = [
  ["v1", "easy", "After ten miles on the trail, Marco was exhausted.", "exhausted", ["tired", "famous", "curious"], 0, "Look for clues about a long effort."],
  ["v2", "easy", "The glass sculpture is delicate, so carry it carefully.", "delicate", ["easy to break", "very loud", "hard to lift"], 0, "The sentence warns you to be careful."],
  ["v3", "easy", "Nia murmured in the library so others could keep reading.", "murmured", ["spoke quietly", "laughed loudly", "jumped quickly"], 0, "Library voices are usually quiet."],
  ["v4", "easy", "Please sort the books in alphabetical order.", "alphabetical", ["following letter order", "from shortest to tallest", "by color"], 0, "Think A to Z."],
  ["v5", "easy", "The coach praised Eli for being punctual to every practice.", "punctual", ["on time", "athletic", "sleepy"], 0, "The clue is every practice."],
  ["v6", "medium", "Kayla hesitated at the edge of the diving board.", "hesitated", ["paused in uncertainty", "fell asleep", "celebrated loudly"], 0, "She did not act right away."],
  ["v7", "medium", "During the drought, clean water became scarce.", "scarce", ["hard to find", "too warm", "polluted"], 0, "The drought reduced supply."],
  ["v8", "medium", "Ari was reluctant to touch the snake, even though it was harmless.", "reluctant", ["unwilling", "excited", "careless"], 0, "He did not want to do it."],
  ["v9", "medium", "The tiny robot can navigate narrow tunnels.", "navigate", ["find its way", "paint walls", "take pictures"], 0, "It moves through tunnels."],
  ["v10", "medium", "The teacher asked for a brief summary of chapter one.", "brief", ["short", "confusing", "incorrect"], 0, "A summary can be short."],
  ["v11", "hard", "The artist was meticulous, checking every brushstroke twice.", "meticulous", ["very careful", "very noisy", "very hungry"], 0, "She checks every detail."],
  ["v12", "hard", "After reading all clues, Tyler concluded the map was upside down.", "concluded", ["reached a final decision", "started over", "asked a question"], 0, "He finished thinking and decided."],
  ["v13", "hard", "The scientist observed the seedlings for three weeks.", "observed", ["watched carefully", "forgot quickly", "watered deeply"], 0, "Think about gathering data."],
  ["v14", "hard", "Mina adjusted the recipe to serve twice as many guests.", "adjusted", ["changed", "memorized", "ignored"], 0, "She modified the plan."],
  ["v15", "hard", "The museum displayed artifacts from ancient cultures.", "artifacts", ["objects from the past", "new inventions", "musical notes"], 0, "Museums show historical objects."],
  ["v16", "medium", "The puppy was energetic and raced around the yard.", "energetic", ["full of energy", "very sleepy", "easy to train"], 0, "Racing around is your clue."],
  ["v17", "medium", "Clouds gathered, signaling an approaching storm.", "approaching", ["coming closer", "moving away", "already finished"], 0, "The storm is near."],
  ["v18", "easy", "Rosa borrowed a flashlight to explore the dark attic.", "explore", ["look around", "clean quickly", "close tightly"], 0, "She uses a flashlight to investigate."],
  ["v19", "hard", "The report was accurate because every fact was verified.", "verified", ["checked for truth", "spelled differently", "hidden from others"], 0, "Facts were checked."],
  ["v20", "easy", "The loud thunder caused the baby to startle.", "startle", ["jump in surprise", "fall asleep", "smile softly"], 0, "Thunder can make someone jump."],
  // ── Additional vocabulary v21-v45 ─────────────────────────────────
  ["v21","easy","The painting used vivid colors that made it stand out on the wall.","vivid",["clear and bright","dull and faded","tiny and light"],0,"Vivid means bold and striking."],
  ["v22","easy","Emma had to compose a short poem for the school anthology.","compose",["create or write","copy from another","delete or remove"],0,"To compose means to create."],
  ["v23","medium","The scientist could detect a tiny change in the water temperature.","detect",["discover or notice","ignore completely","describe loudly"],0,"Detect means to find or notice."],
  ["v24","medium","The flashlight helped illuminate the dark trail in the woods.","illuminate",["light up or brighten","darken or cover","hide or block"],0,"Illuminate means to light something up."],
  ["v25","medium","Even after missing practice, Grace chose to persist and keep training.","persist",["continue despite difficulty","stop and give up","change direction"],0,"Persist means to keep going."],
  ["v26","easy","The new system was so efficient that tasks were finished in half the time.","efficient",["working well without waste","slow and confusing","loud and distracting"],0,"Efficient means organized and effective."],
  ["v27","easy","Lucas raised his hand to inquire about the science project due date.","inquire",["ask for information","argue with the teacher","write an answer"],0,"Inquire means to ask."],
  ["v28","hard","The student had to justify her opinion with evidence from the text.","justify",["give a good reason for","change an opinion on","hide an idea from"],0,"Justify means to support with reasoning."],
  ["v29","medium","When students neglect their reading log, their grades often suffer.","neglect",["fail to take care of","rush through quickly","complete thoroughly"],0,"Neglect means to ignore or not care for."],
  ["v30","easy","On the hiking trail, the class might encounter a family of deer.","encounter",["unexpectedly meet","carefully avoid","slowly follow"],0,"Encounter means to come across unexpectedly."],
  ["v31","medium","Reading every day helps students expand their vocabulary.","expand",["grow or increase","shrink or reduce","repeat or copy"],0,"Expand means to make larger."],
  ["v32","hard","Wind turbines generate electricity for hundreds of homes.","generate",["produce or create","destroy or remove","block or stop"],0,"Generate means to produce."],
  ["v33","easy","The puppys spots resemble tiny polka dots on a white shirt.","resemble",["look similar to","sound different from","move away from"],0,"Resemble means to look like."],
  ["v34","medium","The teacher asked the class to sequence the story events in correct order.","sequence",["arrange in a specific order","remove from a list","read aloud to others"],0,"Sequence means to put in order."],
  ["v35","hard","Practice can transform a nervous reader into a confident speaker.","transform",["change in form or nature","repeat many times","remain exactly the same"],0,"Transform means to change completely."],
  ["v36","hard","The writing coach was asked to critique the first draft of the article.","critique",["evaluate and give feedback on","copy and hand in","ignore and skip over"],0,"Critique means to review carefully."],
  ["v37","medium","She chose to devote her Saturday to helping clean the local park.","devote",["give time and effort to","avoid or skip","rush through quickly"],0,"Devote means to dedicate."],
  ["v38","easy","The loud noise outside began to distract students from their reading.","distract",["take attention away from","help focus better on","remove noise around"],0,"Distract means to pull focus away."],
  ["v39","easy","He showed gratitude by writing thank-you notes to everyone who helped.","gratitude",["feeling thankful","feeling bored","feeling confused"],0,"Gratitude means thankfulness."],
  ["v40","medium","Her logical argument explained step by step why recycling helps Earth.","logical",["following clear reasoning","random and confusing","emotional and rushed"],0,"Logical means based on clear thinking."],
  ["v41","easy","Every student is encouraged to participate in the science fair.","participate",["take part in","leave early from","write about only"],0,"Participate means to join in."],
  ["v42","medium","She was hesitant to raise her hand because she was unsure of her answer.","hesitant",["slow to act due to uncertainty","eager and excited","loud and confident"],0,"Hesitant means unsure or slow to act."],
  ["v43","easy","The clay pot was fragile, so students carried it with both hands.","fragile",["easily broken","very heavy","brightly colored"],0,"Fragile means delicate and breakable."],
  ["v44","hard","The researcher used a microscope to observe the tiny organisms.","observe",["watch or study carefully","destroy or remove","paint or color"],0,"Observe means to watch closely."],
  ["v45","hard","Dust and sand accumulate in corners of the room over time.","accumulate",["gather or build up","disappear quickly","float through air"],0,"Accumulate means to collect gradually."]
];

const mainIdeaRaw = [
  {
    id: "m1",
    difficulty: "easy",
    passage: "School gardens help students learn science. Students measure plant growth, test soil, and track weather. They also harvest vegetables for the cafeteria.",
    mainIdeas: [
      "School gardens teach science through hands-on work.",
      "Cafeteria lunches are expensive.",
      "Weather never changes."
    ],
    mainAnswer: 0,
    details: [
      "Students measure plant growth and test soil.",
      "Students harvest vegetables for the cafeteria.",
      "One student forgot a pencil.",
      "The school painted the gym floor."
    ],
    detailAnswers: [0, 1],
    hint: "Choose the idea that covers all key details."
  },
  {
    id: "m2",
    difficulty: "easy",
    passage: "Community libraries offer more than books. They host coding clubs, reading circles, and homework help. Families visit to learn skills together.",
    mainIdeas: [
      "Libraries support community learning in many ways.",
      "Libraries only lend books.",
      "Families should avoid computers."
    ],
    mainAnswer: 0,
    details: [
      "Libraries host coding clubs and homework help.",
      "Families visit to learn skills together.",
      "The parking lot is busy on Fridays.",
      "The front desk has new chairs."
    ],
    detailAnswers: [0, 1],
    hint: "Two details should directly prove the central idea."
  },
  {
    id: "m3",
    difficulty: "medium",
    passage: "Electric buses reduce noise and air pollution. They run on batteries instead of gasoline. Many cities save money because electric motors need less maintenance.",
    mainIdeas: [
      "Electric buses can improve city life and lower long-term costs.",
      "City buses should be painted blue.",
      "Gasoline is never used in transportation."
    ],
    mainAnswer: 0,
    details: [
      "Electric buses reduce noise and air pollution.",
      "Electric motors need less maintenance.",
      "Some buses have large windows.",
      "Routes change during holidays."
    ],
    detailAnswers: [0, 1],
    hint: "Look for details about both environment and cost."
  },
  {
    id: "m4",
    difficulty: "medium",
    passage: "Sleep helps the brain organize memories. Students who sleep well remember vocabulary better. Good sleep also improves focus during class discussions.",
    mainIdeas: [
      "Sleep supports learning and memory.",
      "Vocabulary tests should be removed.",
      "Class should start at noon."
    ],
    mainAnswer: 0,
    details: [
      "Students who sleep well remember vocabulary better.",
      "Good sleep improves focus in class.",
      "Some students drink milk at lunch.",
      "The school day has seven periods."
    ],
    detailAnswers: [0, 1],
    hint: "Pick details that show how sleep affects learning."
  },
  {
    id: "m5",
    difficulty: "hard",
    passage: "Bees pollinate crops such as apples and cucumbers. Without pollination, many plants produce fewer fruits. Scientists build flower corridors so bees can travel safely.",
    mainIdeas: [
      "Bees are important because they support food production.",
      "Apples are always expensive.",
      "Scientists only study trees."
    ],
    mainAnswer: 0,
    details: [
      "Bees pollinate many crops.",
      "Without pollination, plants produce fewer fruits.",
      "A park added new benches.",
      "Some flowers bloom in spring."
    ],
    detailAnswers: [0, 1],
    hint: "Evidence should explain why bees matter to food."
  },
  {
    id: "m6",
    difficulty: "hard",
    passage: "Volunteers restored a wetland by removing trash and planting native grasses. Bird counts increased, and water quality improved within two years.",
    mainIdeas: [
      "Restoring habitats can improve ecosystems.",
      "Birds always return in winter.",
      "Trash collection is easy."
    ],
    mainAnswer: 0,
    details: [
      "Volunteers removed trash and planted native grasses.",
      "Bird counts increased and water quality improved.",
      "The town painted a mural.",
      "A new road opened nearby."
    ],
    detailAnswers: [0, 1],
    hint: "One detail should be action, another should be result."
  },
  {
    id: "m7",
    difficulty: "easy",
    passage: "Reading every day builds fluency. Students in a reading club improved speed and expression over eight weeks.",
    mainIdeas: [
      "Daily reading practice helps fluency.",
      "Reading clubs should meet once a year.",
      "Expression is not important."
    ],
    mainAnswer: 0,
    details: [
      "Students improved speed over eight weeks.",
      "Students improved expression over eight weeks.",
      "The library has green carpet.",
      "Some students read comics."
    ],
    detailAnswers: [0, 1],
    hint: "Find details that show growth over time."
  },
  {
    id: "m8",
    difficulty: "medium",
    passage: "Reusable water bottles reduce plastic waste at school. After students switched from disposable bottles, trash bins filled more slowly each week.",
    mainIdeas: [
      "Reusable bottles can reduce school waste.",
      "Trash bins should be metal.",
      "Plastic is never useful."
    ],
    mainAnswer: 0,
    details: [
      "Students switched from disposable bottles.",
      "Trash bins filled more slowly each week.",
      "The cafeteria changed its menu.",
      "The school mascot is a hawk."
    ],
    detailAnswers: [0, 1],
    hint: "Select details connected to waste reduction."
  },
  {
    id: "m9",
    difficulty: "medium",
    passage: "Practice presentations help students speak with confidence. During weekly rehearsal sessions, students made stronger eye contact and clearer explanations.",
    mainIdeas: [
      "Regular rehearsal improves speaking confidence.",
      "Eye contact is not needed in speeches.",
      "Students should avoid group work."
    ],
    mainAnswer: 0,
    details: [
      "Students made stronger eye contact.",
      "Students gave clearer explanations.",
      "The classroom has large windows.",
      "Rehearsals were held on Wednesdays."
    ],
    detailAnswers: [0, 1],
    hint: "Evidence should prove confidence and clarity."
  },
  {
    id: "m10",
    difficulty: "hard",
    passage: "Urban trees cool neighborhoods by providing shade and releasing moisture. Streets with more tree cover can be several degrees cooler in summer.",
    mainIdeas: [
      "Trees can reduce heat in cities.",
      "Summer is always too hot.",
      "Only parks need trees."
    ],
    mainAnswer: 0,
    details: [
      "Trees provide shade and release moisture.",
      "Streets with more tree cover are cooler.",
      "Leaf colors vary by season.",
      "Some trees attract birds."
    ],
    detailAnswers: [0, 1],
    hint: "Choose details about temperature effect."
  },
  {
    id: "m11",
    difficulty: "easy",
    passage: "School recycling teams collect paper, plastic, and cans. Their efforts keep useful materials out of landfills.",
    mainIdeas: [
      "Recycling teams help reduce landfill waste.",
      "Landfills are always full.",
      "Paper should not be reused."
    ],
    mainAnswer: 0,
    details: [
      "Teams collect paper, plastic, and cans.",
      "Useful materials stay out of landfills.",
      "The team has blue shirts.",
      "The meeting room has posters."
    ],
    detailAnswers: [0, 1],
    hint: "Match the details to landfill reduction."
  },
  {
    id: "m12",
    difficulty: "medium",
    passage: "Robotics clubs teach problem-solving. Students test designs, find errors, and improve their robots through multiple trials.",
    mainIdeas: [
      "Robotics clubs develop problem-solving skills.",
      "Robots should not be tested.",
      "Design changes are a waste of time."
    ],
    mainAnswer: 0,
    details: [
      "Students test designs and find errors.",
      "Students improve robots through multiple trials.",
      "The club meets after school.",
      "Some robots are painted red."
    ],
    detailAnswers: [0, 1],
    hint: "Choose details that show solving and improving."
  },
  {
    id: "m13",
    difficulty: "hard",
    passage: "Coral reefs protect coastlines from waves and support fish habitats. Warmer ocean temperatures can damage reefs, affecting both protection and biodiversity.",
    mainIdeas: [
      "Coral reefs are vital and vulnerable ecosystems.",
      "Ocean temperatures never change.",
      "Fish do not need habitats."
    ],
    mainAnswer: 0,
    details: [
      "Reefs protect coastlines and support habitats.",
      "Warmer temperatures can damage reefs.",
      "Some beaches have lifeguards.",
      "Boats travel near harbors."
    ],
    detailAnswers: [0, 1],
    hint: "Evidence should show both value and risk."
  },
  {
    id: "m14",
    difficulty: "easy",
    passage: "Morning announcements help students prepare for the day. They include schedules, reminders, and celebration news.",
    mainIdeas: [
      "Announcements keep students informed and ready.",
      "Celebrations are the only purpose of announcements.",
      "Schedules are never important."
    ],
    mainAnswer: 0,
    details: [
      "Announcements include schedules and reminders.",
      "Announcements share celebration news.",
      "The microphone is silver.",
      "Students wear uniforms."
    ],
    detailAnswers: [0, 1],
    hint: "Pick details about how announcements help students."
  },
  {
    id: "m15",
    difficulty: "medium",
    passage: "Stretch breaks during lessons can improve attention. Classes that added short movement breaks had fewer off-task moments.",
    mainIdeas: [
      "Short movement breaks can improve classroom focus.",
      "Stretching replaces learning.",
      "Students should never sit."
    ],
    mainAnswer: 0,
    details: [
      "Classes added short movement breaks.",
      "Classes had fewer off-task moments.",
      "Breaks happened near lunchtime.",
      "Some students stretched at home."
    ],
    detailAnswers: [0, 1],
    hint: "Evidence should show a focus improvement."
  },
  {
    id: "m16",
    difficulty: "hard",
    passage: "Historical diaries reveal daily life details not found in official records. Historians compare multiple diaries to build accurate interpretations.",
    mainIdeas: [
      "Personal diaries are valuable sources for historians.",
      "Official records are always enough.",
      "Interpretations never require comparison."
    ],
    mainAnswer: 0,
    details: [
      "Diaries reveal daily details missing in official records.",
      "Historians compare diaries for accuracy.",
      "Many diaries are handwritten.",
      "Some museums sell postcards."
    ],
    detailAnswers: [0, 1],
    hint: "Select details that prove usefulness and method."
  },
  {
    id: "m17",
    difficulty: "easy",
    passage: "Class pets teach responsibility. Students rotate feeding, cleaning, and observation tasks each week.",
    mainIdeas: [
      "Caring for class pets builds responsibility.",
      "Pets make classrooms noisy.",
      "Cleaning tasks are optional."
    ],
    mainAnswer: 0,
    details: [
      "Students rotate feeding tasks.",
      "Students rotate cleaning and observation tasks.",
      "The cage is near the window.",
      "Pets sleep during the day."
    ],
    detailAnswers: [0, 1],
    hint: "Look for details about assigned duties."
  },
  {
    id: "m18",
    difficulty: "medium",
    passage: "Map skills help travelers make decisions. Reading scale, symbols, and direction lets people plan safer routes.",
    mainIdeas: [
      "Map skills support smart travel planning.",
      "Symbols on maps are decoration.",
      "Directions are not necessary."
    ],
    mainAnswer: 0,
    details: [
      "Reading scale and symbols helps planning.",
      "Direction knowledge helps choose safer routes.",
      "Maps can be folded.",
      "Some routes cross rivers."
    ],
    detailAnswers: [0, 1],
    hint: "Pick details tied to planning decisions."
  },
  {
    id: "m19",
    difficulty: "hard",
    passage: "Citizen science projects let communities contribute data to researchers. Large volunteer datasets help track migration and weather patterns.",
    mainIdeas: [
      "Citizen science expands research with community data.",
      "Researchers do not need data.",
      "Volunteers only collect photos."
    ],
    mainAnswer: 0,
    details: [
      "Communities contribute data to researchers.",
      "Large volunteer datasets track patterns.",
      "Volunteers wear badges.",
      "Projects meet online monthly."
    ],
    detailAnswers: [0, 1],
    hint: "Evidence should show contribution and impact."
  },
  {
    id: "m20",
    difficulty: "easy",
    passage: "Music practice improves performance quality. Students who practiced small sections daily played concerts more confidently.",
    mainIdeas: [
      "Daily section practice improves musical performance.",
      "Concerts should be canceled.",
      "Confidence does not matter."
    ],
    mainAnswer: 0,
    details: [
      "Students practiced small sections daily.",
      "Students played more confidently at concerts.",
      "The stage lights were bright.",
      "The audience clapped loudly."
    ],
    detailAnswers: [0, 1],
    hint: "Choose details that connect practice to results."
  },
  // ── Additional main idea m21-m40 ─────────────────────────────────────────
  { id:"m21",difficulty:"easy",passage:"Solar panels turn sunlight into electricity without burning fuel. Many schools now use them to lower energy costs. Cities across the country are adding solar power to public buildings.",
    mainIdeas:["Solar panels are a cost-saving source of clean energy.","Solar panels are too expensive to build.","Cities never use new technology."],
    mainAnswer:0,details:["Solar panels produce electricity without burning fuel.","Schools use them to lower energy costs.","The panels are painted bright blue.","Buildings are tall in the city."],
    detailAnswers:[0,1],hint:"Look for details about clean power and savings." },
  { id:"m22",difficulty:"easy",passage:"Team sports teach players how to communicate and cooperate. Working together helps players cover each other's mistakes. Coaches say teamwork wins more games than individual skill alone.",
    mainIdeas:["Teamwork is essential for success in team sports.","Individual players never make mistakes.","Coaches only teach drills."],
    mainAnswer:0,details:["Players cover each other's mistakes through cooperation.","Teamwork wins more games than individual skill.","The gym floor was just resurfaced.","Teams wear matching uniforms."],
    detailAnswers:[0,1],hint:"Find details that prove teamwork matters." },
  { id:"m23",difficulty:"medium",passage:"Ocean pollution harms sea animals that accidentally eat plastic. Scientists report that millions of pounds of trash enter the ocean each year. Volunteer groups organize beach cleanups to help reduce the problem.",
    mainIdeas:["Ocean pollution is a serious threat to marine life.","Trash always sinks to the bottom.","Scientists rarely study oceans."],
    mainAnswer:0,details:["Sea animals accidentally eat plastic trash.","Volunteer groups hold beach cleanups.","Boats travel fast on the water.","Oceans cover most of the Earth."],
    detailAnswers:[0,1],hint:"Choose details about harm to animals and cleanup efforts." },
  { id:"m24",difficulty:"easy",passage:"School libraries give students access to thousands of books. Librarians help students find information for research projects. Many libraries also offer reading programs that motivate young readers.",
    mainIdeas:["School libraries support student learning and reading.","Libraries are only used for quiet time.","Librarians only organize shelves."],
    mainAnswer:0,details:["Librarians help students find research information.","Libraries offer reading programs for young readers.","The checkout desk is near the door.","Some libraries have wooden tables."],
    detailAnswers:[0,1],hint:"Find details that show how libraries support learning." },
  { id:"m25",difficulty:"medium",passage:"Eating breakfast helps students stay focused during morning lessons. Studies show that students who skip breakfast have trouble concentrating. Schools with breakfast programs report better attendance and test scores.",
    mainIdeas:["Eating breakfast improves student performance at school.","Breakfast should only include cereal.","Test scores never change."],
    mainAnswer:0,details:["Skipping breakfast causes trouble concentrating.","Breakfast programs improve attendance and test scores.","Cafeterias open early on weekdays.","Some students bring lunch from home."],
    detailAnswers:[0,1],hint:"Pick details that connect breakfast to learning outcomes." },
  { id:"m26",difficulty:"easy",passage:"Butterflies go through four life stages called metamorphosis. They start as eggs, become caterpillars, then form a chrysalis, and finally emerge as butterflies. Each stage has a specific purpose in the butterfly's development.",
    mainIdeas:["Butterflies develop through four distinct stages.","Butterflies only fly in warm weather.","Chrysalis is the final stage."],
    mainAnswer:0,details:["Butterflies start as eggs and become caterpillars.","They form a chrysalis before becoming a butterfly.","Butterflies come in many colors.","Some butterflies migrate south."],
    detailAnswers:[0,1],hint:"Find details that describe the stages of development." },
  { id:"m27",difficulty:"hard",passage:"Air pollution from cars and factories affects human health. Studies link poor air quality to breathing problems and hospital visits. Many cities have created clean air zones to reduce pollution from heavy traffic.",
    mainIdeas:["Air pollution poses real health risks that cities are addressing.","Factories always follow environmental rules.","Hospitals only treat allergies."],
    mainAnswer:0,details:["Poor air quality links to breathing problems and hospital visits.","Cities created clean air zones to reduce traffic pollution.","Some streets are closed on weekends.","Factories use large chimneys."],
    detailAnswers:[0,1],hint:"Choose details about health impacts and city actions." },
  { id:"m28",difficulty:"medium",passage:"Peer tutoring programs help both the student receiving help and the one giving it. Tutors build confidence by teaching others. Research shows students often understand ideas better when they explain them to a classmate.",
    mainIdeas:["Peer tutoring benefits both the tutor and the student being helped.","Only teachers can explain school subjects.","Tutors must be older students."],
    mainAnswer:0,details:["Tutors build confidence by teaching others.","Students understand ideas better when they explain them.","The tutoring room has bean bag chairs.","Sessions happen twice a week."],
    detailAnswers:[0,1],hint:"Find details showing benefits for both tutor and learner." },
  { id:"m29",difficulty:"hard",passage:"Rainforests produce a large share of the world's oxygen. They are home to more than half of the world's species of plants and animals. Deforestation threatens both the ecosystem and the air quality on Earth.",
    mainIdeas:["Rainforests are vital ecosystems that face serious threats.","Rainforests receive only light rain.","Deforestation always increases oxygen."],
    mainAnswer:0,details:["Rainforests produce a large share of Earth's oxygen.","Deforestation threatens the ecosystem and air quality.","Some trees in rainforests are very tall.","Animals sleep in the treetops."],
    detailAnswers:[0,1],hint:"Pick details about why rainforests matter and why they are at risk." },
  { id:"m30",difficulty:"medium",passage:"Keeping a reading journal helps students track their progress and reflect on what they read. Writing about books improves comprehension and makes connections to personal experience easier. Teachers report higher engagement in classes that use reading journals.",
    mainIdeas:["Reading journals improve comprehension and student engagement.","Journals are only for creative writing.","Teachers prefer oral reports over writing."],
    mainAnswer:0,details:["Writing about books improves comprehension and connections.","Teachers report higher engagement with reading journals.","Journals can be digital or paper.","Some students decorate their journal covers."],
    detailAnswers:[0,1],hint:"Choose details that show journals improve reading and engagement." },
  { id:"m31",difficulty:"easy",passage:"Digital literacy means knowing how to use technology safely and effectively. Students learn to evaluate websites to see if information is reliable. Teachers use digital tools to prepare students for modern workplaces.",
    mainIdeas:["Digital literacy prepares students to use technology wisely.","Technology should not be used in classrooms.","All websites share accurate information."],
    mainAnswer:0,details:["Students learn to evaluate websites for reliable information.","Teachers use digital tools to prepare students for modern workplaces.","Some computers have colorful keyboards.","Schools update their software each year."],
    detailAnswers:[0,1],hint:"Find details about skills gained from digital literacy." },
  { id:"m32",difficulty:"hard",passage:"Community gardens give neighborhoods a shared space to grow food. Residents learn gardening skills and share produce with neighbors. Studies show that community gardens also strengthen relationships between people who live nearby.",
    mainIdeas:["Community gardens benefit neighborhoods through food and connection.","Gardens only grow flowers and grass.","Produce from gardens is never shared."],
    mainAnswer:0,details:["Residents learn skills and share produce with neighbors.","Community gardens strengthen relationships between neighbors.","Some gardens have tool sheds nearby.","Gardeners wear gloves while working."],
    detailAnswers:[0,1],hint:"Pick details that show gardens help both food production and community." },
  { id:"m33",difficulty:"easy",passage:"Volunteering teaches important life skills like responsibility and empathy. Students who volunteer regularly often report feeling more connected to their community. Teachers have found that volunteers also perform better in school.","mainIdeas":["Volunteering builds life skills and improves school performance.","Volunteering is only for adults.","Empathy cannot be taught through activities."],
    mainAnswer:0,details:["Volunteers develop responsibility and empathy.","Students who volunteer perform better in school.","Some volunteers wear bright vests.","Organizations schedule shifts in advance."],
    detailAnswers:[0,1],hint:"Find details that show both personal and academic benefits." },
  { id:"m34",difficulty:"medium",passage:"Earthquakes occur when tectonic plates shift and release energy. Scientists use seismographs to measure the strength of earthquakes. Buildings in earthquake-prone areas are designed with flexible frames to withstand shaking.",
    mainIdeas:["Earthquakes are natural events that scientists study and prepare for.","Earthquakes happen every day in every city.","Seismographs are used to predict the weather."],
    mainAnswer:0,details:["Scientists use seismographs to measure earthquake strength.","Buildings in earthquake zones are built with flexible frames.","Some earthquakes happen deep underground.","Tectonic plates move very slowly."],
    detailAnswers:[0,1],hint:"Choose details about how earthquakes are measured and prepared for." },
  { id:"m35",difficulty:"hard",passage:"Student councils give young people a voice in school decisions. Council members gather student opinions and bring concerns to school leaders. Research suggests that student involvement in school decisions increases student satisfaction.",
    mainIdeas:["Student councils increase student voice and school satisfaction.","Student councils plan only school dances.","School leaders make all decisions alone."],
    mainAnswer:0,details:["Council members gather opinions and bring concerns to leaders.","Student involvement increases satisfaction with school.","Elections for council happen each fall.","Council members wear special badges."],
    detailAnswers:[0,1],hint:"Find details about how councils connect students to school decisions." },
  { id:"m36",difficulty:"easy",passage:"Writing personal narratives helps students develop their voice as writers. Sharing personal stories teaches students to express emotions through words. Teachers say personal writing also builds confidence and improves grammar skills.",
    mainIdeas:["Personal narrative writing builds voice, confidence, and grammar skills.","Personal writing is only done in journals.","Grammar cannot improve through storytelling."],
    mainAnswer:0,details:["Personal writing teaches students to express emotions through words.","Teachers say it builds confidence and improves grammar.","Some students share stories aloud in class.","Narratives often start with a personal memory."],
    detailAnswers:[0,1],hint:"Choose details that show how personal writing helps students grow." },
  { id:"m37",difficulty:"medium",passage:"Water conservation is important because freshwater is a limited resource. Simple habits like turning off faucets and fixing leaks can save thousands of gallons per year. Communities that conserve water help protect local rivers and wildlife.",
    mainIdeas:["Conserving water protects a limited resource and helps the environment.","Water is unlimited and never runs out.","Fixing leaks wastes more water."],
    mainAnswer:0,details:["Turning off faucets and fixing leaks saves thousands of gallons.","Conserving water protects local rivers and wildlife.","Some households track water use monthly.","Droughts are more common in dry regions."],
    detailAnswers:[0,1],hint:"Pick details that prove conservation saves water and helps nature." },
  { id:"m38",difficulty:"hard",passage:"Animal migration is driven by seasonal changes in temperature and food availability. Many species travel thousands of miles to find warmer climates or new food sources. Scientists track migration patterns to understand climate change impacts.",
    mainIdeas:["Animals migrate due to seasonal changes in climate and food supply.","Animals migrate only to escape predators.","Scientists do not study animal movement."],
    mainAnswer:0,details:["Animals travel to find warmer climates or new food sources.","Scientists track migration to understand climate change.","Some birds fly over entire continents.","Whales migrate to warmer ocean waters."],
    detailAnswers:[0,1],hint:"Choose details that explain why and how migration is studied." },
  { id:"m39",difficulty:"easy",passage:"Exercise helps keep both the body and brain healthy. Physical activity increases blood flow, which improves concentration and memory. Students who exercise regularly tend to feel less stressed and more energized.",
    mainIdeas:["Regular exercise benefits both physical health and mental focus.","Exercise is only important for athletes.","Brain health is not connected to physical activity."],
    mainAnswer:0,details:["Physical activity increases blood flow and improves concentration.","Students who exercise feel less stressed and more energized.","Some schools added exercise breaks.","Gym classes meet three times a week."],
    detailAnswers:[0,1],hint:"Find details that connect exercise to mental and physical benefits." },
  { id:"m40",difficulty:"hard",passage:"Science experiments in class teach students to ask questions, test ideas, and draw conclusions. Hands-on learning builds critical thinking that cannot be learned just from reading a textbook. Studies show students retain science concepts longer when they perform experiments themselves.",
    mainIdeas:["Classroom experiments build critical thinking and improve science retention.","Science is best learned through textbooks alone.","Experiments always take too much class time."],
    mainAnswer:0,details:["Hands-on learning builds critical thinking skills.","Students retain science concepts longer when they experiment.","Some experiments use simple household materials.","Labs require safety goggles and aprons."],
    detailAnswers:[0,1],hint:"Choose details about thinking skills and how long knowledge lasts." }
];

const figurativeRaw = [
  ["f1", "easy", "Her smile was as bright as the sun.", ["simile", "metaphor", "idiom"], 0, "Look for as or like."],
  ["f2", "easy", "The classroom was a zoo during indoor recess.", ["simile", "metaphor", "idiom"], 1, "A direct comparison without like."],
  ["f3", "easy", "I spilled the beans about the surprise party.", ["simile", "metaphor", "idiom"], 2, "No real beans were involved."],
  ["f4", "medium", "The wind whispered through the pines.", ["personification", "literal", "idiom"], 0, "A non-human thing has a human action."],
  ["f5", "medium", "Time is a thief that steals our moments.", ["simile", "metaphor", "idiom"], 1, "Time is compared directly to something else."],
  ["f6", "medium", "Ava was on cloud nine after the game.", ["literal", "idiom", "metaphor"], 1, "She is not actually in the sky."],
  ["f7", "hard", "The sun peeked over the hill and yawned.", ["personification", "simile", "literal"], 0, "The sun is given human traits."],
  ["f8", "hard", "His words were a blanket on a cold day.", ["simile", "metaphor", "idiom"], 1, "Direct comparison, no like or as."],
  ["f9", "easy", "She ran like a cheetah to the finish line.", ["simile", "metaphor", "idiom"], 0, "Uses the word like."],
  ["f10", "easy", "That math test was a piece of cake.", ["literal", "simile", "idiom"], 2, "It means easy, not dessert."],
  ["f11", "medium", "The moon was a silver coin in the night sky.", ["metaphor", "simile", "literal"], 0, "The moon is directly named as another thing."],
  ["f12", "medium", "The backpack weighed a ton.", ["hyperbole", "literal", "idiom"], 0, "An exaggerated statement."],
  ["f13", "hard", "Books are windows to new worlds.", ["metaphor", "simile", "personification"], 0, "Books are compared to windows."],
  ["f14", "hard", "My little brother is a walking tornado.", ["simile", "idiom", "metaphor"], 2, "Direct comparison describing behavior."],
  ["f15", "easy", "The baby slept like a log.", ["simile", "literal", "metaphor"], 0, "Contains like."],
  ["f16", "medium", "When I heard the good news, I had butterflies in my stomach.", ["idiom", "literal", "simile"], 0, "Butterflies are not real insects here."],
  ["f17", "medium", "The alarm clock screamed at six in the morning.", ["personification", "metaphor", "literal"], 0, "Clock behaves like a person."],
  ["f18", "hard", "Her idea lit a spark in every teammate.", ["metaphor", "simile", "idiom"], 0, "Spark represents inspiration."],
  ["f19", "hard", "The city never sleeps.", ["personification", "literal", "simile"], 0, "A city is treated like a person."],
  ["f20", "easy", "He was as quiet as a mouse during the movie.", ["simile", "metaphor", "idiom"], 0, "Uses as ... as comparison."],
  // ── Additional figurative f21-f45 (includes hyperbole, onomatopoeia, alliteration) ──
  ["f21","easy","I am so hungry I could eat a whole restaurant!",["hyperbole","simile","idiom"],0,"This is an extreme exaggeration to show strong feeling."],
  ["f22","easy","I have told you a million times to clean your room.",["hyperbole","metaphor","literal"],0,"A million times is an exaggeration — not literally true."],
  ["f23","medium","This suitcase weighs a billion pounds.",["hyperbole","literal","personification"],0,"No suitcase actually weighs a billion pounds — this is exaggerated."],
  ["f24","medium","I waited forever for the school bus to arrive.",["hyperbole","simile","alliteration"],0,"Forever is an exaggeration meaning a very long time."],
  ["f25","hard","She cried an ocean of tears when the movie ended.",["hyperbole","metaphor","onomatopoeia"],0,"You cannot literally cry an ocean — this exaggerates emotion."],
  ["f26","easy","The bees buzzed lazily around the bright flowers.",["onomatopoeia","simile","alliteration"],0,"Buzzed imitates the actual sound bees make."],
  ["f27","easy","The bacon sizzled in the hot pan on the stove.",["onomatopoeia","idiom","hyperbole"],0,"Sizzled is a word that sounds like the cooking noise."],
  ["f28","medium","A loud bang echoed down the empty hallway.",["onomatopoeia","metaphor","simile"],0,"Bang imitates the loud sudden sound."],
  ["f29","medium","The door creaked as she slowly pushed it open.",["onomatopoeia","alliteration","literal"],0,"Creaked sounds like the noise a stiff door makes."],
  ["f30","hard","Water gushed from the broken fire hydrant into the street.",["onomatopoeia","personification","idiom"],0,"Gushed imitates the rushing, flowing sound of water."],
  ["f31","easy","Peter Piper picked a peck of pickled peppers.",["alliteration","hyperbole","simile"],0,"The repeating P sound at the start of words is alliteration."],
  ["f32","easy","The slippery snake slithered silently through the soft grass.",["alliteration","metaphor","idiom"],0,"The repeating S sound at the start of several words."],
  ["f33","medium","Bella bravely built a big birdhouse by the barn.",["alliteration","onomatopoeia","literal"],0,"Multiple words start with the same B consonant sound."],
  ["f34","medium","Six silly students sang songs all Saturday long.",["alliteration","hyperbole","personification"],0,"The repeating S sound across all main words."],
  ["f35","hard","Big brown bears bounce between branches in the forest.",["alliteration","simile","onomatopoeia"],0,"Most key words start with the same B consonant sound."],
  ["f36","easy","When it rains that hard, people say it is raining cats and dogs.",["idiom","simile","literal"],0,"Raining cats and dogs means raining very heavily — not literally animals."],
  ["f37","medium","The bright stars danced playfully across the midnight sky.",["personification","metaphor","alliteration"],0,"Stars cannot actually dance — they are given a human action."],
  ["f38","easy","Her voice was as smooth as warm honey on a cold morning.",["simile","metaphor","idiom"],0,"Uses as...as to compare two unlike things."],
  ["f39","medium","Life is a roller coaster of highs and lows for everyone.",["metaphor","simile","hyperbole"],0,"Life is directly called a roller coaster without using like or as."],
  ["f40","easy","He was under the weather and could not come to class.",["idiom","personification","simile"],0,"Under the weather means feeling sick — not literally under weather."],
  ["f41","hard","I have a million things on my to-do list before the weekend.",["hyperbole","metaphor","alliteration"],0,"A million is an exaggeration emphasizing how many tasks there are."],
  ["f42","medium","The clock went tick-tock loudly in the silent classroom.",["onomatopoeia","alliteration","simile"],0,"Tick-tock imitates the actual sound a clock makes."],
  ["f43","hard","Wanda waved wildly as the whistling train pulled away.",["alliteration","personification","hyperbole"],0,"W repeats at the start of key words — alliteration."],
  ["f44","easy","The old house stood as still as a painting on the wall.",["simile","idiom","metaphor"],0,"Uses as...as to compare the stillness of the house to a painting."],
  ["f45","hard","Words are tools that builders use to construct understanding.",["metaphor","simile","onomatopoeia"],0,"Words are directly compared to tools without using like or as."]
];

const storyRaw = [
  ["s1", "easy", "Robot Contest Rescue", [
    "Lina joins the school robotics team.",
    "The robot stops moving before the contest.",
    "Lina finds a loose wire and repairs it.",
    "The team presents and wins teamwork honors."
  ], "Start with setup, then problem, turning point, and ending."],
  ["s2", "easy", "Garden Heat Wave", [
    "Owen plants tomato seeds with his grandmother.",
    "A heat wave dries the garden soil.",
    "Owen adds shade cloth and waters at sunset.",
    "The plants recover and produce ripe tomatoes."
  ], "The climax is the key solving action."],
  ["s3", "medium", "Opening Night", [
    "Kai practices for the school play.",
    "The stage lights fail on opening night.",
    "Kai uses a flashlight trick to continue.",
    "The audience cheers as the show goes on."
  ], "Find the highest tension event before the ending."],
  ["s4", "medium", "Bike Race", [
    "Nia trains with her bike team.",
    "Her chain slips during the final hill.",
    "She fixes the chain and sprints ahead.",
    "Nia finishes strong and celebrates."
  ], "Look for the problem, then the solution moment."],
  ["s5", "hard", "Storm Trail", [
    "A class prepares for a cave science trip.",
    "A sudden storm blocks their return trail.",
    "They decode landmarks to find a safe path.",
    "Everyone returns safely and shares lessons."
  ], "The resolution happens after the major problem is solved."],
  ["s6", "hard", "Audio Project", [
    "Paige records bird songs for a report.",
    "Her recorder crashes before presentation day.",
    "She restores files from a classmate backup.",
    "Paige presents with a backup-plan section."
  ], "Identify where the main conflict is fixed."],
  ["s7", "easy", "Lost Library Card", [
    "Evan visits the library after school.",
    "He cannot find his library card.",
    "He checks his backpack pocket and finds it.",
    "Evan checks out the book he wanted."
  ], "Order events by time in the story."],
  ["s8", "easy", "Field Trip Lunch", [
    "The class arrives at the science museum.",
    "Mina realizes she forgot her lunch.",
    "A friend shares snacks until lunch break.",
    "Mina thanks her friend and enjoys the trip."
  ], "The climax is the moment of help."],
  ["s9", "medium", "Coding Club", [
    "Tyler joins coding club for the first time.",
    "His game crashes before demo day.",
    "He finds a bug in one line and fixes it.",
    "The demo works and he teaches others."
  ], "Find introduction, conflict, climax, resolution."],
  ["s10", "medium", "Rainy Parade", [
    "The neighborhood plans a weekend parade.",
    "Heavy rain begins during setup.",
    "Volunteers move the parade indoors quickly.",
    "The parade continues in the gym."
  ], "Turning point is where action changes outcome."],
  ["s11", "hard", "Ocean Cleanup", [
    "Students plan a beach cleanup project.",
    "A strong tide brings in new trash daily.",
    "They organize repeated cleanup shifts.",
    "The beach becomes cleaner over weeks."
  ], "Resolution comes after sustained effort."],
  ["s12", "hard", "Science Fair", [
    "Ana designs a volcano model for science fair.",
    "Her model leaks before judging begins.",
    "She reinforces the base with clay quickly.",
    "The model works and Ana explains her process."
  ], "Climax is the highest-pressure action."],
  ["s13", "easy", "Snow Day Plan", [
    "Ben wakes up on a snowy morning.",
    "His sled has a broken rope.",
    "Ben ties a new rope from the garage.",
    "He enjoys sledding with friends."
  ], "Arrange events in natural sequence."],
  ["s14", "easy", "Band Practice", [
    "The band meets for afternoon rehearsal.",
    "The drummer arrives late with no sticks.",
    "The teacher lends backup sticks.",
    "Practice continues on schedule."
  ], "Find the problem and the fix."],
  ["s15", "medium", "Community Garden", [
    "A class starts a community herb garden.",
    "Pests chew leaves in the second week.",
    "Students build safe mesh covers.",
    "The herbs grow healthy for harvest day."
  ], "The climax directly addresses the conflict."],
  ["s16", "medium", "Art Show", [
    "Jules prepares paintings for art show.",
    "A frame cracks just before display.",
    "She repairs it with strong backing tape.",
    "Her painting is displayed successfully."
  ], "Climax is the quick repair action."],
  ["s17", "hard", "Debate Team", [
    "The debate team chooses a topic.",
    "Their strongest speaker loses her voice.",
    "Teammates divide points and adapt speeches.",
    "The team presents clearly and earns praise."
  ], "Resolution follows collaborative adjustment."],
  ["s18", "hard", "Nature Trail Map", [
    "Rangers map a new nature trail.",
    "A bridge route is blocked by debris.",
    "They redesign the route with safe markers.",
    "Visitors use the updated trail map."
  ], "Identify the redesign as the turning point."],
  ["s19", "easy", "Chess Match", [
    "Noah enters the school chess match.",
    "He loses his queen early in the game.",
    "Noah uses careful planning for a comeback.",
    "He wins by checkmate in the final moves."
  ], "The comeback move is the climax."],
  ["s20", "medium", "Book Drive", [
    "Students launch a neighborhood book drive.",
    "Donation boxes fill too quickly to carry.",
    "They organize teams and schedule pickups.",
    "The books reach the community center."
  ], "Arrange events from launch to outcome."],
  // ── Additional story s21-s40 ───────────
  ["s21","easy","Spelling Bee",["Emma signs up for the school spelling bee.","She misspells a word in the first round.","Emma studies harder and enters the next competition.","She wins the district spelling bee."],"Setup comes first, then the setback, then the comeback."],
  ["s22","easy","Art Contest",["Mason enters a painting in the school art show.","His canvas rips on the way to school.","He repairs it with tape and a border design.","His artwork wins the creativity award."],"Look for the problem and the creative solution."],
  ["s23","medium","Dog Rescue",["Lily discovers a lost dog near the park.","The dog has no collar or tag.","Lily posts flyers and contacts the shelter.","The owner is found and reunites with the dog."],"The resolution follows the main effort to solve the problem."],
  ["s24","medium","Telescope Night",["Chloe borrows a telescope for the science fair.","Clouds cover the sky on observation night.","She records data using a star map instead.","Chloe presents her research and earns high marks."],"Identify the obstacle and how it was overcome."],
  ["s25","hard","Bake Sale",["Grace plans a bake sale to raise money for the school library.","Her oven breaks on the morning of the event.","She calls friends and bakes at a classmate's kitchen.","The sale raises enough money to buy ten new books."],"The climax is the moment the problem is resolved."],
  ["s26","easy","Classroom Plant",["Jake plants a bean seed in a cup for science class.","The plant wilts after two days without water.","Jake waters it carefully and moves it to the window.","The bean sprout grows tall and healthy by Friday."],"Arrange events from planting to recovery."],
  ["s27","easy","Movie Mix-Up",["Riley brings the wrong disc to class on film day.","The teacher cannot find a replacement quickly.","Riley suggests playing trivia instead.","The class has fun and asks to do it again."],"The turning point is the creative suggestion."],
  ["s28","medium","Trail Cleanup",["Sam organizes a nature trail cleanup with five friends.","Heavy wind blows fresh trash onto the cleaned path.","The group doubles back and cleans a second time.","The trail warden thanks the group and hangs a sign."],"Resolution comes after sustained effort."],
  ["s29","medium","Fire Drill Practice",["Jordan is chosen to lead the class fire drill.","She forgets to remind half the students of the route.","Jordan makes a quick reminder card for everyone.","The drill runs smoothly and the principal congratulates her."],"Identify how the mistake was corrected."],
  ["s30","hard","Holiday Card Drive",["Morgan starts a holiday card campaign for local seniors.","The printer runs out of ink two days before the deadline.","She asks local businesses to donate ink cartridges.","Five hundred cards are delivered on time."],"The resolution follows teamwork to solve the problem."],
  ["s31","easy","Missing Homework",["Jake forgets his homework folder at home.","He tells the teacher as soon as class begins.","The teacher gives him extra time to submit it.","Jake turns it in the next morning."],"Arrange events in time order."],
  ["s32","easy","Puppy Training",["Emma gets a new puppy named Scout.","Scout chews the corner of her favorite book.","Emma buys chew toys and starts training classes.","Scout learns to sit, stay, and leave books alone."],"The climax is when the training starts working."],
  ["s33","medium","Rainy Field Day",["The school plans an outdoor field day in May.","It rains all morning on field day.","Teachers move the games into the gym and cafeteria.","Students compete and have a great time indoors."],"Turning point is when the plan changes to succeed."],
  ["s34","medium","Bridge Project",["Teams build model bridges for a STEM challenge.","Liam and his partner argue over the design.","They split the work and combine both designs.","Their bridge holds the most weight in the contest."],"Resolution follows compromise and teamwork."],
  ["s35","hard","Newspaper Club",["Grace starts a school newspaper club with four members.","The printer breaks before the first issue is ready.","The club posts a digital version online instead.","The paper reaches five times more readers."],"Identify how the obstacle led to a better outcome."],
  ["s36","easy","Lost Trophy",["The soccer team wins the district championship.","The trophy goes missing before the award ceremony.","Players search and find it behind a bench.","The principal presents the trophy at the assembly."],"Arrange events from winning to receiving the award."],
  ["s37","medium","New Student Welcome",["Olivia joins the class in October.","She sits alone at lunch and seems nervous.","Emma invites her to join the reading club.","Olivia makes friends and starts to enjoy school."],"The turning point is the kind action that changes things."],
  ["s38","medium","History Project",["Tyler is assigned a project about the American Revolution.","He cannot find enough sources at the library.","The librarian helps him use digital archives.","Tyler submits a detailed report and earns an A."],"Identify the problem and how outside help solved it."],
  ["s39","hard","Math Team Comeback",["The math team loses their first two competitions.","The coach reviews past mistakes with the group.","Students practice every day for three weeks.","The team wins the regional championship."],"Resolution follows sustained effort and learning from mistakes."],
  ["s40","hard","Community Mural",["A local artist invites students to design a community mural.","The paint donated is the wrong color set.","Students mix colors creatively to make new shades.","The mural becomes a neighborhood landmark."],"Identify the creative solution as the climax."]
];

const evidenceRaw = [
  ["e1", "easy", "Whales communicate over long distances.", "Researchers studied humpback whales in the Pacific Ocean. They recorded songs that traveled for many miles underwater. The whales also migrated to warmer waters in winter.", [
    "Researchers studied humpback whales in the Pacific Ocean.",
    "They recorded songs that traveled for many miles underwater.",
    "The whales also migrated to warmer waters in winter."
  ], 1, "Choose the sentence that directly proves distance communication."],
  ["e2", "easy", "Exercise helps mood.", "A class tracked feelings before and after daily walks. Most students felt calmer after twenty minutes of activity. The class also compared shoe colors.", [
    "A class tracked feelings before and after daily walks.",
    "Most students felt calmer after twenty minutes of activity.",
    "The class also compared shoe colors."
  ], 1, "Pick the sentence with emotional results."],
  ["e3", "medium", "Solar panels can reduce school energy costs.", "Riverdale School installed solar panels in 2024. One year later, utility bills dropped by 18 percent. Students painted a mural near the gym.", [
    "Riverdale School installed solar panels in 2024.",
    "One year later, utility bills dropped by 18 percent.",
    "Students painted a mural near the gym."
  ], 1, "Look for measurable evidence."],
  ["e4", "medium", "Reading daily improves fluency.", "Fifth grade students tracked oral reading speed for six weeks. Students who read fifteen minutes daily increased words-per-minute scores. The library added new beanbag chairs.", [
    "Students tracked oral reading speed for six weeks.",
    "Students who read daily increased words-per-minute scores.",
    "The library added new beanbag chairs."
  ], 1, "Choose data that proves improvement."],
  ["e5", "hard", "Native plants support local wildlife.", "A city park replaced imported grasses with native wildflowers. Within months, observers counted more bees and butterflies. Visitors said the park looked colorful.", [
    "A city park replaced imported grasses with native wildflowers.",
    "Observers counted more bees and butterflies.",
    "Visitors said the park looked colorful."
  ], 1, "Evidence should show wildlife impact."],
  ["e6", "hard", "Practice quizzes improve retention.", "A study compared two groups for a science exam. The group that took short practice quizzes remembered more facts two weeks later. Both groups used the same textbook.", [
    "A study compared two groups for a science exam.",
    "The quiz group remembered more facts two weeks later.",
    "Both groups used the same textbook."
  ], 1, "Pick the sentence that connects quizzes and memory."],
  ["e7", "easy", "Clean water is important for health.", "Doctors explained that safe drinking water lowers the spread of some diseases. The town also opened a new park near the river.", [
    "Safe drinking water lowers the spread of some diseases.",
    "The town opened a new park near the river.",
    "Doctors gave a health presentation."
  ], 0, "Find evidence directly tied to health outcomes."],
  ["e8", "easy", "Plants need sunlight to grow well.", "In a classroom test, plants by the window grew taller than plants kept in a dark closet. Students measured height each week.", [
    "Plants by the window grew taller than plants in a dark closet.",
    "Students measured height each week.",
    "The classroom had two windows."
  ], 0, "Choose the direct comparison result."],
  ["e9", "medium", "Team planning improves project quality.", "Groups that used planning charts had fewer missing steps in final projects. Other groups often had to revise sections late.", [
    "Groups using planning charts had fewer missing steps.",
    "Other groups revised sections late.",
    "Projects were submitted on Friday."
  ], 0, "Look for strongest proof that planning helps quality."],
  ["e10", "medium", "Recycling metal saves resources.", "Recycling aluminum uses less energy than making new aluminum from raw materials. The city added blue recycling bins downtown.", [
    "Recycling aluminum uses less energy than making new aluminum.",
    "The city added blue recycling bins downtown.",
    "Raw materials are transported by truck."
  ], 0, "Pick the sentence that proves resource savings."],
  ["e11", "hard", "Weather satellites improve storm forecasting.", "Satellites send frequent cloud and temperature images to meteorologists. Forecast centers use this data to predict storm paths earlier.", [
    "Satellites send cloud and temperature images to meteorologists.",
    "Forecast centers use this data to predict storm paths earlier.",
    "Storm names are chosen each year."
  ], 1, "Evidence should show forecasting improvement, not background facts."],
  ["e12", "hard", "Protective gear reduces sports injuries.", "A youth league required mouth guards and shin guards. Reported minor injuries decreased over the season compared with last year.", [
    "A youth league required mouth guards and shin guards.",
    "Reported minor injuries decreased over the season.",
    "Teams played on different fields."
  ], 1, "Select the sentence with outcome data."],
  ["e13", "easy", "Class discussions build understanding.", "After partner discussions, students explained science ideas with more detail. The teacher also changed desk arrangements.", [
    "Students explained science ideas with more detail after discussions.",
    "The teacher changed desk arrangements.",
    "Partners were assigned randomly."
  ], 0, "Choose the line that shows stronger understanding."],
  ["e14", "easy", "Regular sleep helps concentration.", "Students who slept at least nine hours made fewer attention errors on a focus task. Some students also kept sleep journals.", [
    "Students sleeping nine hours made fewer attention errors.",
    "Some students kept sleep journals.",
    "The task had three sections."
  ], 0, "Pick the sentence with concentration results."],
  ["e15", "medium", "Composting reduces cafeteria waste.", "The school composted fruit peels and vegetable scraps daily. After a month, trash volume from lunch dropped by 25 percent.", [
    "The school composted fruit peels and scraps daily.",
    "Trash volume from lunch dropped by 25 percent.",
    "Students ate lunch in two shifts."
  ], 1, "The best evidence includes a measured reduction."],
  ["e16", "medium", "Taking notes helps memory.", "Students who summarized each paragraph in notebooks remembered more key facts on a quiz than students who only reread.", [
    "Students who summarized notes remembered more key facts.",
    "Some students used colored pens.",
    "The quiz had ten questions."
  ], 0, "Choose the sentence that compares outcomes."],
  ["e17", "hard", "Bridge design must consider load limits.", "Engineers tested model bridges with increasing weights. Designs with triangle supports held more load before bending.", [
    "Engineers tested model bridges with increasing weights.",
    "Designs with triangle supports held more load before bending.",
    "Some bridges were painted gray."
  ], 1, "Find evidence that proves which design handled load better."],
  ["e18", "hard", "Restored wetlands reduce flooding risk.", "After wetland restoration, nearby streets flooded less often during heavy rain. Native plants slowed runoff and absorbed water.", [
    "Nearby streets flooded less often after restoration.",
    "Native plants slowed runoff and absorbed water.",
    "Residents planted flowers in yards."
  ], 0, "Pick the strongest direct evidence for lower flooding risk."],
  ["e19", "easy", "Practicing scales improves piano accuracy.", "Students who practiced scales daily made fewer note errors in performances. Recital programs were printed in blue ink.", [
    "Students practicing scales made fewer note errors.",
    "Recital programs were printed in blue ink.",
    "Performances took place in spring."
  ], 0, "Choose the sentence about fewer errors."],
  ["e20", "medium", "Helmet use increases bike safety.", "In a safety unit, classes that wore helmets during practice had fewer head-impact incidents than classes without helmets.", [
    "Classes that wore helmets had fewer head-impact incidents.",
    "The safety unit lasted two weeks.",
    "Bikes were stored in a shed."
  ], 0, "Pick evidence comparing helmet use and incidents."],
  // ── Additional evidence e21-e40 ────────────────────
  ["e21","easy","Trees help reduce city noise.","Researchers placed sound monitors on tree-lined streets. Readings showed lower noise levels compared to streets without trees. The city also installed new streetlights.",["Readings showed lower noise levels on tree-lined streets.","The city installed new streetlights.","Researchers placed sound monitors near buildings."],0,"Pick the sentence that directly proves trees reduce noise."],
  ["e22","easy","Breakfast helps students stay focused in class.","A study followed two groups of fifth graders for a month. Students who ate breakfast scored higher on morning attention tests. The cafeteria also added new seating.",["Students who ate breakfast scored higher on attention tests.","The cafeteria added new seating.","Researchers followed groups for a month."],0,"Choose the direct evidence of breakfast helping focus."],
  ["e23","medium","Libraries improve student reading skills.","A school tracked reading levels before and after a library program. After six months, scores rose by one full grade level. Students also attended more field trips.",["Reading scores rose one full grade level after the library program.","Students attended more field trips.","The school tracked reading levels before and after."],0,"Choose the data that proves library programs raise reading skill."],
  ["e24","easy","Sunscreen prevents skin damage.","Dermatologists recommend applying sunscreen before outdoor activity. Studies show regular sunscreen use reduces sunburn by more than half. The beach was crowded on the holiday weekend.",["Studies show sunscreen use reduces sunburn by more than half.","The beach was crowded on the holiday weekend.","Dermatologists recommend outdoor protection."],0,"Find the evidence with a measurable reduction in sunburn."],
  ["e25","medium","Drinking water improves student energy levels.","A wellness program measured energy ratings from students throughout the day. Students who drank six glasses of water reported feeling more alert in the afternoon. The water fountain was recently repaired.",["Students who drank six glasses of water felt more alert.","The water fountain was recently repaired.","A wellness program measured energy ratings."],0,"Pick the sentence showing water intake and alertness are connected."],
  ["e26","hard","Music education improves math performance.","A university study compared math scores of students with and without music classes. Music students scored an average of twelve percent higher on math assessments. The school added new band uniforms.",["Music students scored twelve percent higher on math assessments.","The school added new band uniforms.","A study compared test scores between groups."],0,"Choose the specific result data that proves the connection."],
  ["e27","easy","Handwashing reduces the spread of germs.","Health teachers explained that germs transfer through touch. Students who washed hands before lunch had fewer sick days. The hallway floors were recently cleaned.",["Students who washed hands had fewer sick days.","The hallway floors were recently cleaned.","Germs transfer through touch."],0,"Find the direct evidence that handwashing reduces sick days."],
  ["e28","medium","Outdoor recess improves classroom behavior.","Researchers observed two classrooms over ten weeks. The class with outdoor recess showed fewer disruptions during lessons. Both classes used the same textbooks.",["The class with recess showed fewer disruptions during lessons.","Both classes used the same textbooks.","Researchers observed classrooms over ten weeks."],0,"Pick the direct result proving recess reduces disruptions."],
  ["e29","hard","Volunteering improves teen mental health.","A psychology study tracked high school volunteers for one semester. Teens who volunteered weekly reported lower stress and higher life satisfaction scores. The study was conducted in three different states.",["Teens who volunteered reported lower stress and higher satisfaction.","The study was conducted in three states.","Researchers tracked volunteers for one semester."],0,"Find the outcome data linking volunteering to mental health."],
  ["e30","medium","Insects are important for pollinating food crops.","Agricultural scientists studied apple orchards with and without bees. Orchards visited by bees produced thirty percent more fruit per tree. Farmers wore protective gear during inspections.",["Orchards with bees produced thirty percent more fruit per tree.","Farmers wore protective gear during inspections.","Scientists studied orchards with and without bees."],0,"Find the measurable proof that bees increase crop yields."],
  ["e31","easy","Getting enough sleep helps memory.","A sleep researcher tested recall scores after students slept different amounts. Students who slept nine hours remembered significantly more vocabulary words. Students also used flashcards to study.",["Students who slept nine hours remembered more vocabulary words.","Students used flashcards to study.","A researcher tested recall after different sleep amounts."],0,"Choose the result that directly proves sleep improves memory."],
  ["e32","easy","Plant-based diets can reduce grocery costs.","A nutrition class compared weekly grocery bills for different diet types. Families who ate mostly plants spent an average of twenty dollars less per week. The store had a sale on frozen vegetables.",["Plant-based families spent twenty dollars less per week.","The store had a sale on frozen vegetables.","The class compared grocery bills across diet types."],0,"Pick the evidence with a specific cost comparison."],
  ["e33","medium","Urban green spaces reduce city temperatures.","City planners measured summer temperatures in parks and nearby paved streets. Parks were an average of six degrees cooler than surrounding concrete areas. The city council voted on new zoning laws.",["Parks were six degrees cooler than surrounding concrete areas.","The city council voted on new zoning laws.","Planners measured temperatures in parks and streets."],0,"Find the direct temperature comparison proving green spaces cool cities."],
  ["e34","hard","Coding skills prepare students for future careers.","A workforce report tracked graduates who studied computer science in school. Those with coding experience were fifty percent more likely to be hired in technology fields. Schools also updated their science labs.",["Coding graduates were fifty percent more likely to be hired in tech fields.","Schools also updated their science labs.","A workforce report tracked computer science graduates."],0,"Choose the hiring data linking coding to career readiness."],
  ["e35","medium","Limiting screen time improves sleep quality.","A pediatrics study tracked children who used devices before bed. Children who stopped screen use one hour before sleep fell asleep fifteen minutes faster. The study covered two hundred families.",["Children who stopped screens before bed fell asleep fifteen minutes faster.","The study covered two hundred families.","Researchers tracked device use before bedtime."],0,"Find the evidence showing screen limits improve sleep speed."],
  ["e36","easy","Wearing a helmet reduces bike injury risk.","Safety inspectors reviewed hospital data after a helmet awareness campaign. Head injuries dropped by forty percent in neighborhoods where helmets were promoted. Bike lanes were also widened that year.",["Head injuries dropped forty percent where helmets were promoted.","Bike lanes were widened that year.","Inspectors reviewed hospital data after the campaign."],0,"Pick the outcome data proving helmets reduce injuries."],
  ["e37","hard","Mentorship programs improve student graduation rates.","A district study followed students paired with adult mentors for two years. Students with mentors graduated at a rate twelve percent higher than those without. The district also hired five new counselors.",["Students with mentors graduated twelve percent more often.","The district hired five new counselors.","A study followed mentor-paired students for two years."],0,"Find the graduation rate data that proves mentorship helps."],
  ["e38","medium","Classroom plants improve air quality.","A science class measured carbon dioxide levels in two rooms. The room with ten plants had lower carbon dioxide readings after one week. The other room had newer windows installed.",["The room with plants had lower carbon dioxide readings.","The other room had newer windows installed.","Scientists measured carbon dioxide in two rooms."],0,"Choose the direct air quality comparison proving plants help."],
  ["e39","easy","Peer reading partners improve fluency.","A literacy specialist paired students for reading three times a week. After eight weeks, partnered readers improved fluency scores by two grade levels. Some students also joined a book club.",["Partnered readers improved fluency by two grade levels.","Some students also joined a book club.","A specialist paired students three times per week."],0,"Find the measurable improvement data from peer reading."],
  ["e40","hard","Local farming reduces food transportation emissions.","Environmental researchers compared emissions from local farms and distant suppliers. Locally grown produce generated seventy percent less transportation emissions. The farmers market opened a new indoor location.",["Local produce generated seventy percent less transportation emissions.","The farmers market opened a new indoor location.","Researchers compared local and distant farm emissions."],0,"Choose the specific emissions data proving local farming is greener."]
];

export const GATE_QUESTIONS = {
  1: vocabRaw.map(([id, difficulty, sentence, targetWord, options, answer, hint]) => ({
    id,
    difficulty,
    sentence,
    targetWord,
    options,
    answer,
    hint
  })),
  2: mainIdeaRaw,
  3: figurativeRaw.map(([id, difficulty, phrase, options, answer, hint]) => ({
    id,
    difficulty,
    phrase,
    options,
    answer,
    hint
  })),
  4: storyRaw.map(([id, difficulty, title, steps, hint]) => ({
    id,
    difficulty,
    title,
    steps,
    hint
  })),
  5: evidenceRaw.map(([id, difficulty, claim, passage, options, answer, hint]) => ({
    id,
    difficulty,
    claim,
    passage,
    options,
    answer,
    hint
  }))
};

export const ENCOURAGING_LINES = [
  "Amazing strategy!",
  "You are powering up Lexoria!",
  "Great thinking, hero!",
  "That was an expert move!",
  "Crystal energy restored!"
];

export const GENTLE_LINES = [
  "Nice try. Use the clue and try again.",
  "You are close. Check the context details.",
  "Great effort. Read the hint and go again.",
  "Learning in progress. Your next move can work."
];