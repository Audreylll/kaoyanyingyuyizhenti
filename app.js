(() => {
  "use strict";

  const data = window.TEM4_DATA || { exams: [] };
  const lexicon = window.TEM4_LEXICON || {};
  const usageLexicon = window.TEM4_USAGE || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const paper = $("#paper");
  const nav = $("#sectionNav");
  const storageKey = "tem4-vocabulary-v2";
  const dictionaryKey = "tem4-dictionary-cache-v2";
  const translationKey = "tem4-translation-cache-v2";
  const writingKey = "tem4-handwriting-v1";
  const typingKey = "tem4-keyboard-dictation-v1";
  const wordSelectionKey = "tem4-word-selection-v1";
  const studyProgressKey = "tem4-study-progress-v1";
  const studyAutoSpeakKey = "tem4-study-autospeak-v1";
  const importanceWords = new Set(("abandon abstract academic access accommodate accumulate acknowledge acquire adapt adequate adjacent advocate ambiguous apparent arbitrary assess assume attain attribute authentic bias cease coherent coincide compelling comprehensive conceive consecutive considerable constitute constrain controversy conventional crucial decline define derive diminish discriminate distinct diverse domestic elaborate emerge empirical enhance equivalent establish evident explicit facilitate fluctuate fundamental generate hypothesis identify imply impose incentive inevitable inhibit initiate insight integral interpret intervene intrinsic justify maintain manipulate mechanism modify mutual notion objective obtain perceive persist perspective plausible preliminary presume prevalent profound promote proportion pursue rational reinforce relevant reluctant resolve retain reveal significant subsequent substitute sustain tentative transform trigger ultimate undermine valid welfare").split(/\s+/));
  const phraseEntries = [
    ["according to","根据；按照"],["as well as","以及；除……之外还"],["in order to","为了"],["due to","由于；因为"],
    ["rather than","而不是"],["lead to","导致；通向"],["result in","导致"],["result from","由……造成"],
    ["be based on","以……为基础"],["contribute to","促成；有助于"],["deal with","处理；应对"],["depend on","依靠；取决于"],
    ["rely on","依赖；依靠"],["account for","解释；占比"],["for instance","例如"],["in terms of","就……而言；从……方面"],
    ["in contrast","相比之下"],["in addition","此外"],["by means of","借助；通过"],["with regard to","关于；就……而言"],
    ["be supposed to","应该；被认为会"],["be likely to","很可能"],["be able to","能够"],["be willing to","愿意"],
    ["be concerned with","涉及；与……有关"],["be concerned about","担心；关心"],["be responsible for","对……负责；是……的原因"],
    ["take part in","参加"],["take place","发生；举行"],["make up","构成；编造；和解"],["set up","建立；设立"],
    ["bring about","引起；带来"],["carry out","实施；执行"],["come up with","想出；提出"],["put forward","提出"],
    ["take into account","把……考虑在内"],["take into consideration","把……考虑在内"],["on account of","由于；因为"],
    ["in spite of","尽管"],["as a result","因此；结果"],["at least","至少"],["no longer","不再"],
    ["no less than","不少于；至少"],["no more than","不超过；至多"],["more or less","或多或少；大致"],
    ["nothing more than","只不过；仅仅"],["other than","除……之外；不同于"],
    ["more than","多于；不仅仅"],["less than","少于；不到"],["a variety of","各种各样的"],["a number of","许多"],
    ["the number of","……的数量"],["make sense","讲得通；有意义"],["in favor of","支持；赞成"],["in response to","作为对……的回应"],
    ["in relation to","关于；与……相比"],["apart from","除……之外"],["instead of","代替；而不是"],["along with","连同；与……一起"],
    ["regardless of","不管；不顾"],["by way of","作为；经由"],["be exposed to","接触；暴露于"],["be involved in","参与；卷入"],
    ["have access to","有权使用；可以接触"],["be associated with","与……相关"],["be regarded as","被视为"],["refer to","指的是；提到"],
    ["turn out","结果是；证明是"],["work out","解决；算出；锻炼"],["give rise to","引起；导致"],["live up to","达到；不辜负"],
    ["come across","偶然遇到；给人……印象"],["catch on","流行起来；理解"],["put across","表达清楚"],["carry on","继续"],
    ["break down","出故障；分解；崩溃"],["take over","接管"],["take on","承担；呈现；雇用"],["bring up","提出；养育"],
    ["point out","指出"],["focus on","集中于"],["concentrate on","专注于"],["adapt to","适应"],["adjust to","适应；调整"],
    ["object to","反对"],["be used to","习惯于"],["used to","过去常常"],["look forward to","期待"],
    ["in the long run","从长远来看"],["in the light of","鉴于；根据"],["at the expense of","以牺牲……为代价"],
    ["for the sake of","为了；为了……的利益"],["on behalf of","代表"],["in accordance with","依照；与……一致"],
    ["in comparison with","与……相比"],["be bound to","必然；一定会"],["be attributed to","归因于"],["stem from","源于"],
    ["derive from","源自；由……得到"],["consist of","由……组成"],["be composed of","由……组成"],["devote to","致力于；投入"],
    ["apply to","适用于；向……申请"],["apply for","申请"],["suffer from","遭受；患有"],["benefit from","受益于"],
    ["participate in","参加"],["distinguish between","区分"],["a great deal of","大量的"],["a series of","一系列"],
    ["such as","例如；诸如"],["as soon as","一……就……"],["even though","即使；尽管"],["so that","以便；因此"],
    ["not only","不仅"],["but also","而且"],["on the other hand","另一方面"],["in other words","换句话说"]
  ].map(([label, zh]) => {
    let source = label.split(" ").map(part => part.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("\\s+");
    source = source.replace(/^be\\s\+/, "(?:be|am|is|are|was|were|been|being)\\s+");
    return {label, zh, pattern:new RegExp(`\\b${source}\\b`,"gi")};
  });

  let examIndex = Math.max(0, data.exams.length - 1);
  let sectionIndex = Math.min(2, Math.max(0, (data.exams[examIndex]?.sections.length || 1) - 1));
  let selectedWord = null;
  let savedWords = loadJSON(storageKey, {});
  let dictionaryCache = loadJSON(dictionaryKey, {});
  let translationCache = loadJSON(translationKey, {});
  let writingCache = loadJSON(writingKey, {});
  let typingCache = loadJSON(typingKey, {});
  const storedWordSelection = loadJSON(wordSelectionKey, null);
  let selectedWordKeys = new Set(Array.isArray(storedWordSelection) ? storedWordSelection.filter(key => savedWords[key]) : Object.keys(savedWords));
  let exportSelectedKeys = new Set();
  let handwritingSelectedKeys = new Set();
  let studySelectedKeys = new Set();
  let handwritingQueue = [];
  let handwritingMode = "zh-en";
  let answerMethod = "handwrite";
  let studyQueue = [];
  let studyIndex = 0;
  let studyKnown = 0;
  let studyProgress = loadJSON(studyProgressKey, {});
  let studyAutoSpeak = localStorage.getItem(studyAutoSpeakKey) !== "0";
  let glossVisible = true;
  let wordGlossVisible = localStorage.getItem("tem4-word-gloss-visible") !== "0";
  let translationVisible = true;
  let audio = null;
  let dictationIndex = 0;
  let strokes = [];
  let activeStroke = null;

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  }

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; }
  }

  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* localStorage may be unavailable */ }
  }

  function normalizeWord(word = "") {
    return word.toLowerCase().replace(/[’]/g, "'").replace(/^[^a-z]+|[^a-z'-]+$/g, "");
  }

  function lemmaCandidates(word) {
    const raw = normalizeWord(word);
    const out = [raw];
    const irregular = {
      kept:"keep", made:"make", took:"take", taken:"take", got:"get", gotten:"get",
      had:"have", did:"do", done:"do", went:"go", gone:"go", came:"come",
      gave:"give", given:"give", found:"find", thought:"think", knew:"know", known:"know",
      felt:"feel", left:"leave", told:"tell", said:"say", spoke:"speak", spoken:"speak",
      paid:"pay", spent:"spend", meant:"mean", became:"become", held:"hold", brought:"bring"
    };
    if (irregular[raw]) out.push(irregular[raw]);
    if (raw.endsWith("'s")) out.push(raw.slice(0, -2));
    if (raw.endsWith("ies")) out.push(raw.slice(0, -3) + "y");
    if (raw.endsWith("ves")) out.push(raw.slice(0, -3) + "f", raw.slice(0, -3) + "fe");
    if (raw.endsWith("ing") && raw.length > 5) out.push(raw.slice(0, -3), raw.slice(0, -3) + "e");
    if (raw.endsWith("ied")) out.push(raw.slice(0, -3) + "y");
    if (raw.endsWith("ed") && raw.length > 4) out.push(raw.slice(0, -2), raw.slice(0, -1));
    if (raw.endsWith("es") && raw.length > 4) out.push(raw.slice(0, -2), raw.slice(0, -1));
    if (raw.endsWith("s") && raw.length > 3) out.push(raw.slice(0, -1));
    return [...new Set(out.filter(Boolean))];
  }

  function lookupOffline(word) {
    const candidates = lemmaCandidates(word);
    const usageLemma = candidates.find(candidate => usageLexicon[candidate]);
    const ordered = usageLemma ? [usageLemma, ...candidates] : candidates;
    for (const candidate of [...new Set(ordered)]) {
      if (lexicon[candidate]) return {key:candidate, ...lexicon[candidate]};
    }
    return null;
  }

  function usageForWord(word) {
    for (const candidate of lemmaCandidates(word)) {
      if (usageLexicon[candidate]) return {key:candidate, items:usageLexicon[candidate]};
    }
    return null;
  }

  function cleanChineseMeaning(value = "") {
    const parts = String(value)
      .replace(/\[[^\]]+\]/g, "")
      .split(/[；;]/)
      .map(item => item.replace(/^(?:n|v|vt|vi|adj|adv|prep|pron|conj|art|num|aux|int|a|ad)\.\s*/i, "").trim())
      .filter(item => /[\u3400-\u9fff]/.test(item));
    return [...new Set(parts)].slice(0, 3).join("；");
  }

  function wordChinese(item) {
    const offline = lookupOffline(item.word)?.zh || "";
    const raw = item.info?.zh || item.meaning || offline;
    return cleanChineseMeaning(raw) || "暂无中文释义";
  }

  function wordDefinition(item) {
    return item.info?.definitions?.find(def => def.definition)?.definition
      || lookupOffline(item.word)?.definition?.split(/[；;]/).find(Boolean)
      || "暂无英文解释";
  }

  function savedWordList(keys = null) {
    return Object.values(savedWords)
      .filter(item => !keys || keys.has(item.key))
      .sort((a, b) => a.word.localeCompare(b.word, "en"));
  }

  function persistWordSelection() {
    saveJSON(wordSelectionKey, [...selectedWordKeys]);
  }

  function renderWordPicker(container, selectedKeys, emptyText = "生词本还是空的") {
    const list = savedWordList();
    container.innerHTML = list.length ? list.map(item => `<label class="word-pick-item">
      <input type="checkbox" value="${escapeHtml(item.key)}" ${selectedKeys.has(item.key) ? "checked" : ""}>
      <span><strong>${escapeHtml(item.word)}</strong><small>${escapeHtml(wordChinese(item))}</small></span>
    </label>`).join("") : `<p class="picker-empty">${escapeHtml(emptyText)}</p>`;
  }

  function setPickerSelection(container, selectedKeys, checked) {
    $$("input[type=checkbox]", container).forEach(input => {
      input.checked = checked;
      if (checked) selectedKeys.add(input.value); else selectedKeys.delete(input.value);
    });
  }

  function inlineMeaning(word) {
    const raw = lookupOffline(word)?.zh || "";
    if (!raw) return "";
    const first = raw.split(/[；;]/)[0].replace(/^(?:n|v|vt|vi|adj|adv|prep|pron|conj|art|num|aux|int)\.\s*/i, "").trim();
    return first.length > 18 ? `${first.slice(0, 18)}…` : first;
  }

  function isImportant(word) {
    return lemmaCandidates(word).some(item => importanceWords.has(item)) || normalizeWord(word).length >= 10;
  }

  function phraseRanges(text) {
    const candidates = [];
    phraseEntries.forEach(entry => {
      entry.pattern.lastIndex = 0;
      for (const match of text.matchAll(entry.pattern)) {
        candidates.push({start:match.index, end:match.index + match[0].length, label:entry.label, actual:match[0], zh:entry.zh});
      }
    });
    candidates.sort((a,b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const ranges = [];
    candidates.forEach(candidate => {
      if (!ranges.some(item => candidate.start < item.end && candidate.end > item.start)) ranges.push(candidate);
    });
    return ranges;
  }

  function wordHTML(word, context, phrase, phraseLead) {
    const key = normalizeWord(word);
    const classes = ["word-wrap"];
    if (isImportant(word)) classes.push("marked");
    if (phrase) classes.push("phrase");
    if (phraseLead) classes.push("phrase-lead");
    if (savedWords[key]) classes.push("saved");
    const gloss = phraseLead ? phrase.zh : inlineMeaning(word);
    return `<span class="${classes.join(" ")}" tabindex="0" role="button" data-word="${escapeHtml(word)}" data-key="${escapeHtml(key)}" data-context="${escapeHtml(context)}" data-meaning="${escapeHtml(inlineMeaning(word))}" data-phrase="${escapeHtml(phrase?.actual || "")}" data-phrase-zh="${escapeHtml(phrase?.zh || "")}"><span class="word">${escapeHtml(word)}</span><span class="gloss${phraseLead ? " phrase-gloss" : ""}">${escapeHtml(gloss)}</span></span>`;
  }

  function renderWords(text, context = "") {
    const source = String(text);
    const ranges = phraseRanges(source);
    const tokenPattern = /[A-Za-z]+(?:[’'-][A-Za-z]+)*|\d+(?:[,.]\d+)*|_{2,}|[^A-Za-z\d\s_]+/g;
    const tokens = [...source.matchAll(tokenPattern)];
    return tokens.map(match => {
      const token = match[0];
      const phrase = ranges.find(item => match.index >= item.start && match.index + token.length <= item.end);
      const phraseLead = phrase && match.index === phrase.start;
      if (/^[A-Za-z]/.test(token)) return wordHTML(token, context, phrase, phraseLead);
      if (/^_/.test(token)) return `<span class="blank-token">${escapeHtml(token)}</span>`;
      if (/^\d/.test(token)) return `<span class="number-token">${escapeHtml(token)}</span>`;
      return `<span class="punct">${escapeHtml(token)}</span>`;
    }).join(" ");
  }

  function allSections() {
    return data.exams.flatMap((exam, eIndex) => exam.sections.map((section, sIndex) => ({ exam, section, eIndex, sIndex })));
  }

  function currentExam() { return data.exams[examIndex]; }
  function currentSection() { return currentExam()?.sections[sectionIndex]; }

  function parseHash() {
    const match = location.hash.match(/^#exam-(\d+)-section-(\d+)$/);
    if (!match) return;
    examIndex = Math.max(0, Math.min(data.exams.length - 1, Number(match[1])));
    sectionIndex = Math.max(0, Math.min(data.exams[examIndex].sections.length - 1, Number(match[2])));
  }

  function buildNav(filter = "") {
    nav.innerHTML = "";
    const needle = filter.trim().toLowerCase();
    data.exams.forEach((exam, eIndex) => {
      const visibleSections = exam.sections.map((section, sIndex) => ({ section, sIndex })).filter(({section}) =>
        !needle || `${exam.year} ${exam.variant} ${section.part} ${section.title} ${section.heading}`.toLowerCase().includes(needle)
      );
      if (!visibleSections.length) return;
      const label = document.createElement("div");
      label.className = "nav-group";
      label.textContent = `${exam.year} · ${exam.variant}`;
      nav.appendChild(label);
      visibleSections.forEach(({section, sIndex}) => {
        const button = document.createElement("button");
        button.className = `nav-item${eIndex === examIndex && sIndex === sectionIndex ? " active" : ""}`;
        button.innerHTML = `<span class="nav-label">Part ${escapeHtml(section.part)} · ${escapeHtml(section.title)}</span><span>${String(sIndex + 1).padStart(2, "0")}</span>`;
        button.addEventListener("click", () => { examIndex = eIndex; sectionIndex = sIndex; renderSection(true); $("#sidebar").classList.remove("open"); });
        nav.appendChild(button);
      });
    });
  }

  function renderSection(shouldScroll = false) {
    const exam = currentExam();
    const section = currentSection();
    if (!exam || !section) { paper.innerHTML = "<p>未找到可读取的真题数据。</p>"; return; }
    location.hash = `exam-${examIndex}-section-${sectionIndex}`;
    $("#examYear").textContent = exam.year;
    $("#examName").textContent = "英语专业四级";
    $("#examVariant").textContent = `${exam.variant} · 不含听写/听力`;
    $("#sectionEyebrow").textContent = `${exam.year} · PART ${section.part}`;
    $("#sectionTitle").textContent = section.title;
    $("#sectionIntro").textContent = `${exam.label} · 已移除 Dictation 与 Talk；点击任意单词查看中文词义、音标、发音、英文释义和固定用法。`;
    const contentBlocks = section.blocks || [];
    paper.innerHTML = `
      <h2 class="paper-title">${escapeHtml(exam.label)} · ${escapeHtml(section.title)}</h2>
      <p class="paper-subtitle">逐词精读 · 重点词黄色 · 短语蓝色</p>
      <div class="passage">${contentBlocks.map((block, index) => renderBlock(block, index, exam, section)).join("")}</div>`;
    paper.classList.toggle("hide-gloss", !glossVisible);
    paper.classList.toggle("hide-word-gloss", !wordGlossVisible);
    paper.classList.toggle("hide-translation", !translationVisible);
    buildNav($("#navSearch").value);
    updatePageButtons();
    $("#progressValue").textContent = "0%";
    if (shouldScroll) window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderBlock(block, index, exam, section) {
    if (block.kind === "heading") return `<h3 class="section-heading">${escapeHtml(block.en)}</h3>`;
    const blockId = `${exam.id}-${section.part}-${index}`;
    const cached = block.zh || translationCache[blockId] || "";
    return `<article class="para-block" data-block-id="${escapeHtml(blockId)}" data-source="${escapeHtml(block.en)}" data-translation="${escapeHtml(cached)}">
      <div class="english-line">${renderWords(block.en, `${exam.year} ${section.title}`)}</div>
      <p class="translation ${cached ? "" : "pending"}"><strong>语境译文：</strong><span>${escapeHtml(cached || "此段暂缺离线译文，请重新运行本地译文构建工具。")}</span><em class="offline-badge">${cached ? "离线译文" : "离线译文缺失"}</em></p>
    </article>`;
  }

  function flatPosition() {
    const flat = allSections();
    const index = flat.findIndex(item => item.eIndex === examIndex && item.sIndex === sectionIndex);
    return { flat, index };
  }

  function updatePageButtons() {
    const {flat, index} = flatPosition();
    $("#prevButton").disabled = index <= 0;
    $("#nextButton").disabled = index < 0 || index >= flat.length - 1;
  }

  function navigate(delta) {
    const {flat, index} = flatPosition();
    const target = flat[index + delta];
    if (!target) return;
    examIndex = target.eIndex; sectionIndex = target.sIndex; renderSection(true);
  }

  function speak(word, audioUrl = "") {
    if (audioUrl) {
      if (audio) audio.pause();
      audio = new Audio(audioUrl);
      audio.play().catch(() => speakWithBrowser(word));
      return;
    }
    speakWithBrowser(word);
  }

  function speakWithBrowser(word) {
    if (!("speechSynthesis" in window)) { showToast("当前浏览器不支持语音朗读"); return; }
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-GB"; utterance.rate = 0.76; utterance.pitch = 1;
    const voices = speechSynthesis.getVoices();
    utterance.voice = voices.find(v => v.lang === "en-GB") || voices.find(v => v.lang.startsWith("en")) || null;
    speechSynthesis.speak(utterance);
  }

  function stopSpeaking() {
    if (audio) { audio.pause(); audio = null; }
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  }

  async function fetchDictionary(word) {
    const candidates = lemmaCandidates(word);
    const offline = offlineDictionary(word);
    if (offline?.phrases?.length) return offline;
    for (const key of candidates) {
      if (dictionaryCache[key]) return mergeDictionary(offline, dictionaryCache[key]);
    }
    for (const key of candidates) {
      try {
        const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(key)}&md=dpr&max=1`);
        if (!response.ok) continue;
        const words = await response.json();
        const item = words.find(entry => entry.word === key) || words[0];
        if (!item) continue;
        const relatedResponse = await fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(key)}&max=8`);
        const related = relatedResponse.ok ? await relatedResponse.json() : [];
        const parsed = parseDatamuse(item, key, related);
        parsed.phrases = await fetchOnlineUsage(key, related);
        const merged = mergeDictionary(offline, parsed);
        dictionaryCache[key] = merged; saveJSON(dictionaryKey, dictionaryCache); return merged;
      } catch { /* try next lemma */ }
    }
    for (const key of candidates) {
      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(key)}`);
        if (!response.ok) continue;
        const entries = await response.json();
        const parsed = parseDictionary(entries, key);
        parsed.phrases = await fetchOnlineUsage(key, []);
        const merged = mergeDictionary(offline, parsed);
        dictionaryCache[key] = merged; saveJSON(dictionaryKey, dictionaryCache); return merged;
      } catch { /* browser speech remains available */ }
    }
    return offline || { word, phonetic: "音标暂不可用", audio: "", definitions: [], phrases: [], source: "offline" };
  }

  function mergeDictionary(offline, online) {
    if (!offline) return online;
    return {
      ...online,
      word: offline.word || online.word,
      phonetic: offline.phonetic !== "音标暂不可用" ? offline.phonetic : online.phonetic,
      definitions: online.definitions?.length ? online.definitions : offline.definitions,
      phrases: [...new Set([...(offline.phrases || []), ...(online.phrases || [])])].slice(0, 12),
      zh: offline.zh || "",
      source: `${offline.source} + ${online.source || "online"}`
    };
  }

  async function translateOnlinePhrase(phrase) {
    try {
      const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(phrase)}&langpair=en|zh-CN`);
      if (!response.ok) return "";
      const payload = await response.json();
      return payload?.responseData?.translatedText?.trim() || "";
    } catch {
      return "";
    }
  }

  async function fetchOnlineUsage(word, related = []) {
    const requests = [
      fetch(`https://api.datamuse.com/words?rel_jjb=${encodeURIComponent(word)}&max=5`),
      fetch(`https://api.datamuse.com/words?rel_jji=${encodeURIComponent(word)}&max=5`),
      fetch(`https://api.datamuse.com/words?rel_trg=${encodeURIComponent(word)}&max=5`)
    ];
    const payloads = await Promise.all(requests.map(request => request.then(response => response.ok ? response.json() : []).catch(() => [])));
    const candidates = new Set();
    payloads[0].forEach(item => item.word && candidates.add(`${item.word} ${word}`));
    payloads[1].forEach(item => item.word && candidates.add(`${word} ${item.word}`));
    [...related, ...payloads[2]].forEach(item => item.word && candidates.add(`${word} + ${item.word}`));
    const phrases = [...candidates].filter(item => item.length < 70).slice(0, 8);
    const translated = await Promise.all(phrases.map(async phrase => {
      const english = phrase.replace(/ \+ /g, " ");
      const chinese = await translateOnlinePhrase(english);
      return chinese ? `${english}：${chinese}` : `${english}：在线补充搭配`;
    }));
    return translated.filter(Boolean);
  }

  function offlineDictionary(word) {
    const entry = lookupOffline(word);
    if (!entry) return null;
    const definitions = (entry.definition || "").split(/[；;]/).map(item => item.trim()).filter(Boolean).slice(0, 8).map(definition => ({
      part: entry.pos || "definition", definition, example:"", synonyms:[]
    }));
    const usage = usageForWord(word);
    const candidates = new Set(lemmaCandidates(word).filter(item => item.length > 3));
    const relatedPhrases = phraseEntries
      .filter(item => item.label.split(" ").some(part => candidates.has(part)))
      .map(item => `${item.label}：${item.zh}`);
    const phrases = [...new Set([...(usage?.items || []), ...relatedPhrases])].slice(0, 10);
    return {
      word: entry.key || normalizeWord(word),
      phonetic: entry.phonetic ? `/${entry.phonetic.replace(/^\/+|\/+$/g, "")}/` : "音标暂不可用",
      audio: "",
      definitions,
      phrases,
      zh: entry.zh || "",
      source: "ECDICT offline"
    };
  }

  function parseDictionary(entries, fallbackWord) {
    const entry = entries[0] || {};
    const phonetics = entries.flatMap(item => item.phonetics || []);
    const meanings = entries.flatMap(item => item.meanings || []);
    const definitions = meanings.flatMap(meaning => (meaning.definitions || []).slice(0, 3).map(def => ({
      part: meaning.partOfSpeech || "", definition: def.definition || "", example: def.example || "", synonyms: (def.synonyms || []).slice(0, 5)
    }))).slice(0, 8);
    const phrases = [];
    meanings.forEach(meaning => {
      const synonyms = (meaning.synonyms || []).slice(0, 6);
      if (synonyms.length) phrases.push(`${meaning.partOfSpeech || "usage"}: ${synonyms.join(", ")}`);
    });
    definitions.filter(def => def.example).slice(0, 4).forEach(def => phrases.push(def.example));
    return {
      word: entry.word || fallbackWord,
      phonetic: entry.phonetic || phonetics.find(p => p.text)?.text || "音标暂不可用",
      audio: phonetics.find(p => p.audio)?.audio || "",
      definitions, phrases: [...new Set(phrases)].slice(0, 8), source: "dictionaryapi.dev"
    };
  }

  function parseDatamuse(item, fallbackWord, related = []) {
    const tags = item.tags || [];
    const phonetic = tags.find(tag => tag.startsWith("pron:"))?.slice(5) || "音标暂不可用";
    const partNames = { n: "noun", v: "verb", adj: "adjective", adv: "adverb", u: "unknown" };
    const definitions = (item.defs || []).slice(0, 8).map(raw => {
      const [part, ...definition] = raw.split("\t");
      return { part: partNames[part] || part || "", definition: definition.join(" "), example: "", synonyms: [] };
    });
    const associations = related.slice(0, 8).map(entry => `${fallbackWord} · ${entry.word}`);
    return {
      word: item.word || fallbackWord,
      phonetic,
      audio: `https://api.dictionaryapi.dev/media/pronunciations/en/${encodeURIComponent(item.word || fallbackWord)}-us.mp3`,
      definitions,
      phrases: associations,
      source: "datamuse.com"
    };
  }

  async function openWordDrawer(target) {
    const article = target.closest(".para-block");
    const contextText = article?.dataset.source || target.dataset.word;
    const contextTranslation = article?.dataset.translation || "";
    const offlineEntry = lookupOffline(target.dataset.word);
    selectedWord = {
      word: target.dataset.word,
      key: target.dataset.key,
      context: target.dataset.context || currentSection().title,
      meaning: target.dataset.meaning || offlineEntry?.zh || "",
      phrase: target.dataset.phrase || "",
      phraseZh: target.dataset.phraseZh || ""
    };
    $("#detailWord").textContent = selectedWord.word;
    $("#detailPhonetic").textContent = offlineEntry?.phonetic ? `/${offlineEntry.phonetic.replace(/^\/+|\/+$/g, "")}/` : "正在查询音标…";
    const alignedZh = alignedSentenceTranslation(contextText, contextTranslation, selectedWord.word);
    const phraseNote = selectedWord.phraseZh ? `；文中搭配 ${selectedWord.phrase}：${selectedWord.phraseZh}` : "";
    $("#detailChinese").textContent = `${offlineEntry?.zh || selectedWord.meaning || "暂无离线中文释义"}${phraseNote}${alignedZh ? `　｜　语境：${alignedZh}` : ""}`;
    $("#detailDefinitions").innerHTML = '<p class="loading-line">正在读取离线英文释义…</p>';
    $("#detailUsage").innerHTML = '<p class="loading-line">正在整理短语搭配与固定用法…</p>';
    updateStar();
    $("#wordDrawer").classList.add("open"); $("#drawerShade").classList.add("open");
    $("#wordDrawer").setAttribute("aria-hidden", "false");
    speak(selectedWord.word);
    const info = await fetchDictionary(selectedWord.word);
    if (!selectedWord || selectedWord.key !== target.dataset.key) return;
    selectedWord.info = info;
    $("#detailPhonetic").textContent = info.phonetic;
    $("#detailDefinitions").innerHTML = info.definitions.length ? info.definitions.map(def => `<article><span>${escapeHtml(def.part)}</span><p>${escapeHtml(def.definition)}</p>${def.example ? `<small>Example: ${escapeHtml(def.example)}</small>` : ""}</article>`).join("") : '<p class="loading-line">暂无离线英文释义；仍可使用浏览器发音并收藏该词。</p>';
    renderUsage(info);
  }

  function renderUsage(info = selectedWord?.info || {}) {
    const usages = [...new Set([...(selectedWord?.phraseZh ? [`文中：${selectedWord.phrase}：${selectedWord.phraseZh}`] : []), ...(info.phrases || [])])];
    $("#detailUsage").innerHTML = usages.length
      ? usages.map(item => `<p>• ${escapeHtml(item)}</p>`).join("")
      : '<div class="usage-empty"><p>离线词库暂未收录该词的可靠搭配。</p><button class="online-usage-button" id="fetchOnlineUsage">联网补充用法</button><small>仅发送当前单词，不上传真题段落。</small></div>';
  }

  async function loadOnlineUsage() {
    if (!selectedWord) return;
    const button = $("#fetchOnlineUsage");
    if (button) { button.disabled = true; button.textContent = "正在联网查询…"; }
    const phrases = await fetchOnlineUsage(selectedWord.word);
    if (!selectedWord) return;
    selectedWord.info = selectedWord.info || { phrases: [] };
    selectedWord.info.phrases = [...new Set([...(selectedWord.info.phrases || []), ...phrases])];
    if (phrases.length) {
      const cacheKey = selectedWord.key || normalizeWord(selectedWord.word);
      dictionaryCache[cacheKey] = selectedWord.info;
      saveJSON(dictionaryKey, dictionaryCache);
    }
    renderUsage(selectedWord.info);
    if (!phrases.length) {
      $("#detailUsage").innerHTML = '<div class="usage-empty"><p>在线词典暂时没有返回可靠搭配，请稍后重试。</p><button class="online-usage-button" id="fetchOnlineUsage">重新联网查询</button></div>';
    }
  }

  function alignedSentenceTranslation(english, chinese, word) {
    if (!chinese) return "";
    const englishSentences = english.match(/[^.!?]+[.!?]?/g) || [english];
    const chineseSentences = chinese.match(/[^。！？]+[。！？]?/g) || [chinese];
    const key = normalizeWord(word);
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
    const index = Math.max(0, englishSentences.findIndex(sentence => new RegExp(`\\b${escaped}\\b`, "i").test(sentence)));
    return (chineseSentences[Math.min(index, chineseSentences.length - 1)] || chinese).trim();
  }

  function closeDrawer() {
    $("#wordDrawer").classList.remove("open"); $("#drawerShade").classList.remove("open");
    $("#wordDrawer").setAttribute("aria-hidden", "true");
  }

  function updateStar() {
    const saved = selectedWord && savedWords[selectedWord.key];
    $("#detailStar").classList.toggle("saved", Boolean(saved));
    $("#detailStar").textContent = saved ? "★" : "☆";
  }

  function toggleSelectedWord() {
    if (!selectedWord) return;
    if (savedWords[selectedWord.key]) {
      delete savedWords[selectedWord.key];
      selectedWordKeys.delete(selectedWord.key);
    } else {
      savedWords[selectedWord.key] = { ...selectedWord, info: selectedWord.info || null, addedAt: Date.now() };
      selectedWordKeys.add(selectedWord.key);
    }
    saveJSON(storageKey, savedWords); persistWordSelection(); renderVocabulary(); updateStar();
    $$(".word-wrap[data-key]").forEach(el => el.classList.toggle("saved", Boolean(savedWords[el.dataset.key])));
  }

  function renderVocabulary() {
    const list = Object.values(savedWords).sort((a, b) => b.addedAt - a.addedAt);
    selectedWordKeys = new Set([...selectedWordKeys].filter(key => savedWords[key]));
    $("#wordCount").textContent = list.length;
    $("#emptyHint").style.display = list.length ? "none" : "block";
    $("#clearWords").style.display = list.length ? "block" : "none";
    $("#vocabBulk").style.display = list.length ? "flex" : "none";
    $("#selectedWordCount").textContent = `已选 ${selectedWordKeys.size}`;
    $("#vocabList").innerHTML = list.map(item => `<div class="vocab-item">
      <label class="vocab-select" title="选择用于打印与练习"><input type="checkbox" data-select-word="${escapeHtml(item.key)}" ${selectedWordKeys.has(item.key) ? "checked" : ""}></label>
      <button class="vocab-speak" data-speak="${escapeHtml(item.word)}">▶</button>
      <strong>${escapeHtml(item.word)}</strong><span>${escapeHtml(wordChinese(item))}</span>
      <button class="vocab-remove" data-remove="${escapeHtml(item.key)}" title="移除">×</button>
    </div>`).join("");
  }

  function openExportModal() {
    if (!Object.keys(savedWords).length) { showToast("生词本还是空的，先收藏几个单词吧"); return; }
    exportSelectedKeys = new Set(selectedWordKeys);
    renderWordPicker($("#exportWordList"), exportSelectedKeys);
    updateExportCount();
    $("#exportModal").classList.add("open");
    $("#exportModal").setAttribute("aria-hidden", "false");
  }

  function closeExportModal() {
    $("#exportModal").classList.remove("open");
    $("#exportModal").setAttribute("aria-hidden", "true");
  }

  function updateExportCount() { $("#exportSelectedCount").textContent = `已选 ${exportSelectedKeys.size} 个`; }

  function buildPrintSheet(list, mode) {
    if (!list.length) { showToast("请至少选择一个生词"); return false; }
    const date = new Intl.DateTimeFormat("zh-CN", {year:"numeric", month:"long", day:"numeric"}).format(new Date());
    const direction = mode === "en-zh" ? "看英文写中文" : "看中文写英文";
    const questions = list.map((item, i) => {
      const english = escapeHtml(item.word);
      const chinese = escapeHtml(wordChinese(item));
      return `<div class="print-practice-row"><span class="print-number">${i + 1}</span><div class="print-cell ${mode === "zh-en" ? "write-cell" : "cue-cell"}">${mode === "zh-en" ? "" : english}</div><div class="print-cell ${mode === "en-zh" ? "write-cell" : "cue-cell"}">${mode === "en-zh" ? "" : chinese}</div></div>`;
    }).join("");
    const answers = list.map((item, i) => `<div class="answer-row"><span>${i + 1}</span><strong>${escapeHtml(item.word)}</strong><p>${escapeHtml(wordChinese(item))}</p></div>`).join("");
    $("#printSheet").innerHTML = `<h1 class="print-title">英语专业四级 · 生词双向默写</h1><div class="print-meta">姓名：__________　日期：${date}　共 ${list.length} 词　模式：${direction}</div><div class="print-table-head"><span>序号</span><strong>英文</strong><strong>中文</strong></div><div class="print-practice-table">${questions}</div><section class="answer-page"><h2>参考答案</h2><p class="answer-note">完整答案：左侧英文，右侧中文</p><div class="answer-table-head"><span>序号</span><strong>英文</strong><strong>中文</strong></div><div class="answer-grid">${answers}</div></section>`;
    return true;
  }

  function confirmExport() {
    const list = savedWordList(exportSelectedKeys);
    const mode = $('input[name="printMode"]:checked')?.value || "en-zh";
    if (!buildPrintSheet(list, mode)) return;
    closeExportModal();
    requestAnimationFrame(() => window.print());
  }

  function dictationWords() { return handwritingQueue; }

  function openHandwriting() {
    if (!Object.keys(savedWords).length) { showToast("先收藏生词，再开始手写默写"); return; }
    handwritingSelectedKeys = new Set(selectedWordKeys);
    renderWordPicker($("#handwritingWordList"), handwritingSelectedKeys);
    $("#handwritingSetup").hidden = false;
    $("#handwritingSession").hidden = true;
    $("#handwritingModal").classList.add("open"); $("#handwritingModal").setAttribute("aria-hidden", "false");
  }

  function startHandwriting() {
    handwritingQueue = savedWordList(handwritingSelectedKeys);
    if (!handwritingQueue.length) { showToast("请至少选择一个默写生词"); return; }
    handwritingMode = $('input[name="handwritingMode"]:checked')?.value || "zh-en";
    answerMethod = $('input[name="answerMethod"]:checked')?.value || "handwrite";
    dictationIndex = 0;
    $("#handwritingSetup").hidden = true;
    $("#handwritingSession").hidden = false;
    $("#handwritingDrawArea").hidden = answerMethod !== "handwrite";
    $("#handwritingKeyboardArea").hidden = answerMethod !== "keyboard";
    requestAnimationFrame(() => {
      if (answerMethod === "handwrite") resizeCanvas();
      renderDictation();
      if (answerMethod === "keyboard") $("#dictationKeyboardInput").focus();
    });
  }

  function closeHandwriting() {
    if (!$("#handwritingSession").hidden) saveCurrentPractice();
    $("#handwritingModal").classList.remove("open"); $("#handwritingModal").setAttribute("aria-hidden", "true");
  }

  function backToHandwritingSetup() {
    saveCurrentPractice();
    $("#handwritingSession").hidden = true;
    $("#handwritingSetup").hidden = false;
  }

  function renderDictation() {
    const list = dictationWords(); const item = list[dictationIndex]; if (!item) return;
    const chinese = wordChinese(item);
    const definition = wordDefinition(item);
    $("#dictationCounter").textContent = `${dictationIndex + 1} / ${list.length}`;
    $("#dictationPrompt").textContent = handwritingMode === "zh-en" ? chinese : item.word;
    $("#dictationClue").textContent = `英文解释：${definition}`;
    $("#dictationAnswer").textContent = `${item.word} — ${chinese}`; $("#dictationAnswer").classList.add("hidden-answer");
    $("#dictationSpeak").style.visibility = handwritingMode === "zh-en" ? "visible" : "visible";
    $("#handwritingCanvas").setAttribute("aria-label", handwritingMode === "zh-en" ? "书写英文" : "书写中文");
    $(".canvas-watermark").textContent = handwritingMode === "zh-en" ? "在这里写英文" : "在这里写中文";
    $("#dictationKeyboardInput").placeholder = handwritingMode === "zh-en" ? "请输入英文单词" : "请输入中文意思";
    $("#typingResult").textContent = "";
    $("#typingResult").className = "typing-result";
    $("#revealAnswer").textContent = "显示答案";
    if (answerMethod === "handwrite") loadCurrentWriting(); else loadCurrentTyping();
  }

  function openStudy() {
    if (!Object.keys(savedWords).length) { showToast("先收藏生词，再开始背词"); return; }
    studySelectedKeys = new Set(selectedWordKeys);
    renderWordPicker($("#studyWordList"), studySelectedKeys);
    renderStudyAutoControls();
    $("#studySetup").hidden = false;
    $("#studySession").hidden = true;
    $("#studyModal").classList.add("open");
    $("#studyModal").setAttribute("aria-hidden", "false");
  }

  function renderStudyAutoControls() {
    $("#studyAutoSpeak").checked = studyAutoSpeak;
    $("#studyAutoToggle").textContent = studyAutoSpeak ? "🔊 自动发音：开" : "🔇 自动发音：关";
    $("#studyAutoToggle").setAttribute("aria-pressed", String(studyAutoSpeak));
  }

  function setStudyAutoSpeak(enabled, speakNow = false) {
    studyAutoSpeak = enabled;
    localStorage.setItem(studyAutoSpeakKey, enabled ? "1" : "0");
    renderStudyAutoControls();
    if (!enabled) stopSpeaking();
    if (enabled && speakNow) {
      const item = studyQueue[studyIndex];
      if (item) speak(item.word, item.info?.audio);
    }
  }

  function closeStudy() {
    $("#studyModal").classList.remove("open");
    $("#studyModal").setAttribute("aria-hidden", "true");
  }

  function startStudy() {
    studyQueue = savedWordList(studySelectedKeys);
    if (!studyQueue.length) { showToast("请至少选择一个背诵生词"); return; }
    studyQueue = [...studyQueue].sort(() => Math.random() - .5);
    studyIndex = 0; studyKnown = 0;
    $("#studySetup").hidden = true;
    $("#studySession").hidden = false;
    renderStudyCard();
  }

  function renderStudyCard() {
    const item = studyQueue[studyIndex];
    if (!item) {
      $("#studyWord").textContent = "本轮完成";
      $("#studyPhonetic").textContent = "";
      $("#studyDefinition").textContent = `共复习 ${studyIndex} 张卡片，标记掌握 ${studyKnown} 次。`;
      $("#studyChinese").textContent = "可以返回重新选择生词，或关闭后继续阅读。";
      $("#studyChinese").classList.remove("hidden-meaning");
      $("#studySpeak").disabled = true;
      $("#revealStudy").style.display = "none";
      $("#studyAgain").style.display = "none";
      $("#studyKnown").style.display = "none";
      $("#studyProgressText").textContent = "完成";
      $("#studyProgressBar").style.width = "100%";
      return;
    }
    const offline = lookupOffline(item.word);
    $("#studyWord").textContent = item.word;
    $("#studyPhonetic").textContent = item.info?.phonetic || (offline?.phonetic ? `/${offline.phonetic.replace(/^\/+|\/+$/g, "")}/` : "");
    $("#studyDefinition").textContent = wordDefinition(item);
    $("#studyChinese").textContent = wordChinese(item);
    $("#studyChinese").classList.add("hidden-meaning");
    $("#studySpeak").disabled = false;
    $("#revealStudy").style.display = "inline-block";
    $("#studyAgain").style.display = "inline-block";
    $("#studyKnown").style.display = "inline-block";
    $("#revealStudy").textContent = "显示中文";
    $("#studyProgressText").textContent = `${studyIndex + 1} / ${studyQueue.length}`;
    $("#studyKnownCount").textContent = `已掌握 ${studyKnown}`;
    $("#studyProgressBar").style.width = `${Math.round(studyIndex / Math.max(1, studyQueue.length) * 100)}%`;
    if (studyAutoSpeak) speak(item.word, item.info?.audio);
  }

  function revealStudyMeaning() {
    const meaning = $("#studyChinese");
    meaning.classList.toggle("hidden-meaning");
    $("#revealStudy").textContent = meaning.classList.contains("hidden-meaning") ? "显示中文" : "隐藏中文";
  }

  function rateStudy(known) {
    const item = studyQueue[studyIndex]; if (!item) return;
    const record = studyProgress[item.key] || { known:0, review:0 };
    record.review += 1; record.known += known ? 1 : 0; record.reviewedAt = Date.now();
    studyProgress[item.key] = record; saveJSON(studyProgressKey, studyProgress);
    if (known) studyKnown += 1;
    else studyQueue.push(item);
    studyIndex += 1;
    renderStudyCard();
  }

  function backToStudySetup() {
    $("#studySession").hidden = true;
    $("#studySetup").hidden = false;
    renderWordPicker($("#studyWordList"), studySelectedKeys);
  }

  function canvas() { return $("#handwritingCanvas"); }
  function canvasPoint(event) { const rect = canvas().getBoundingClientRect(); const p = event.touches?.[0] || event; return {x:(p.clientX-rect.left)/rect.width, y:(p.clientY-rect.top)/rect.height}; }
  function resizeCanvas() { const c = canvas(); const rect = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; c.width = Math.max(1, Math.round(rect.width*dpr)); c.height = Math.max(1, Math.round(rect.height*dpr)); redrawCanvas(); }
  function redrawCanvas() {
    const c = canvas(); const ctx = c.getContext("2d"); const rect = c.getBoundingClientRect(); const dpr = window.devicePixelRatio || 1; ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,rect.width,rect.height); ctx.lineCap="round"; ctx.lineJoin="round";
    strokes.forEach(stroke => { if (!stroke.points.length) return; ctx.strokeStyle=stroke.color; ctx.lineWidth=stroke.size; ctx.beginPath(); stroke.points.forEach((p,i) => { const x=p.x*rect.width,y=p.y*rect.height; i?ctx.lineTo(x,y):ctx.moveTo(x,y); }); ctx.stroke(); });
  }
  function startStroke(event) { event.preventDefault(); activeStroke={color:$("#penColor").value,size:Number($("#penSize").value),points:[canvasPoint(event)]}; strokes.push(activeStroke); canvas().setPointerCapture?.(event.pointerId); }
  function moveStroke(event) { if(!activeStroke)return; event.preventDefault(); activeStroke.points.push(canvasPoint(event)); redrawCanvas(); }
  function endStroke() { activeStroke=null; saveCurrentWriting(); }
  function writingId() { const key=dictationWords()[dictationIndex]?.key; return key ? `${handwritingMode}:${key}` : ""; }
  function saveCurrentWriting() { const id=writingId(); if(!id)return; writingCache[id]=strokes; saveJSON(writingKey,writingCache); }
  function loadCurrentWriting() { strokes=writingCache[writingId()]||[]; redrawCanvas(); }
  function typingId() { const key=dictationWords()[dictationIndex]?.key; return key ? `${handwritingMode}:${key}` : ""; }
  function saveCurrentTyping() { const id=typingId(); if(!id)return; typingCache[id]=$("#dictationKeyboardInput").value; saveJSON(typingKey,typingCache); }
  function loadCurrentTyping() { $("#dictationKeyboardInput").value=typingCache[typingId()]||""; }
  function saveCurrentPractice() { answerMethod === "keyboard" ? saveCurrentTyping() : saveCurrentWriting(); }
  function moveDictation(delta) { saveCurrentPractice(); const list=dictationWords(); dictationIndex=(dictationIndex+delta+list.length)%list.length; renderDictation(); speak(list[dictationIndex].word,list[dictationIndex].info?.audio); }
  function checkKeyboardAnswer() {
    const item=dictationWords()[dictationIndex]; if(!item)return;
    const value=$("#dictationKeyboardInput").value.trim(); const result=$("#typingResult");
    if(!value){result.textContent="请先输入答案";result.className="typing-result needs-review";return;}
    saveCurrentTyping();
    const expected=handwritingMode==="zh-en"?item.word:wordChinese(item);
    let correct=false;
    if(handwritingMode==="zh-en") correct=normalizeWord(value)===normalizeWord(item.word);
    else {
      const compact=text=>text.replace(/[\s，,。.!！?？；;：:、]/g,"");
      const typed=compact(value);
      correct=expected.split(/[；;]/).map(compact).filter(Boolean).some(part=>(typed.length>=2||part.length===1)&&(typed.includes(part)||part.includes(typed)));
    }
    result.textContent=correct?`回答正确：${expected}`:`请对照参考答案：${expected}`;
    result.className=`typing-result ${correct?"correct":"needs-review"}`;
  }
  function downloadCanvas() { const link=document.createElement("a"); link.download=`TEM4-${writingId() || "handwriting"}.png`; link.href=canvas().toDataURL("image/png"); link.click(); }

  let toastTimer;
  function showToast(message) { const toast=$("#toast"); toast.textContent=message; toast.classList.add("show"); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove("show"),2200); }
  function updateProgress() { const rect=paper.getBoundingClientRect(); const total=Math.max(1,rect.height-window.innerHeight*.45); const passed=Math.max(0,Math.min(total,-rect.top+120)); $("#progressValue").textContent=`${Math.round(passed/total*100)}%`; }

  parseHash(); buildNav(); renderVocabulary(); renderSection(false);
  $("#toggleWordGloss span").textContent = wordGlossVisible ? "开" : "关";

  paper.addEventListener("click", event => {
    const word=event.target.closest(".word-wrap[data-word]"); if(word){openWordDrawer(word);return;}
  });
  paper.addEventListener("keydown", event => { if((event.key==="Enter"||event.key===" ")&&event.target.matches(".word-wrap[data-word]")) openWordDrawer(event.target); });
  $("#prevButton").addEventListener("click",()=>navigate(-1)); $("#nextButton").addEventListener("click",()=>navigate(1));
  $("#toggleWordGloss").addEventListener("click",()=>{wordGlossVisible=!wordGlossVisible;paper.classList.toggle("hide-word-gloss",!wordGlossVisible);$("#toggleWordGloss span").textContent=wordGlossVisible?"开":"关";localStorage.setItem("tem4-word-gloss-visible",wordGlossVisible?"1":"0");});
  $("#toggleGloss").addEventListener("click",()=>{glossVisible=!glossVisible;paper.classList.toggle("hide-gloss",!glossVisible);$("#toggleGloss span").textContent=glossVisible?"开":"关";});
  $("#toggleTranslation").addEventListener("click",()=>{translationVisible=!translationVisible;paper.classList.toggle("hide-translation",!translationVisible);$("#toggleTranslation span").textContent=translationVisible?"开":"关";});
  $("#navSearch").addEventListener("input",event=>buildNav(event.target.value));
  $("#menuButton").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  $("#toolsButton").addEventListener("click",event=>{event.stopPropagation();$("#topActions").classList.toggle("open");});
  $("#topActions").addEventListener("click",event=>{if(event.target.closest("button")&&innerWidth<=1020)$("#topActions").classList.remove("open");});
  document.addEventListener("click",event=>{if(innerWidth<=1020&&!event.target.closest("#topActions")&&!event.target.closest("#toolsButton"))$("#topActions").classList.remove("open");});
  $("#closeDrawer").addEventListener("click",closeDrawer); $("#drawerShade").addEventListener("click",closeDrawer); $("#detailStar").addEventListener("click",toggleSelectedWord); $("#wordSpeak").addEventListener("click",()=>selectedWord&&speak(selectedWord.word,selectedWord.info?.audio));
  $("#detailUsage").addEventListener("click",event=>{if(event.target.closest("#fetchOnlineUsage"))loadOnlineUsage();});
  $("#vocabList").addEventListener("click",event=>{const remove=event.target.dataset.remove;if(remove){delete savedWords[remove];selectedWordKeys.delete(remove);exportSelectedKeys.delete(remove);handwritingSelectedKeys.delete(remove);studySelectedKeys.delete(remove);saveJSON(storageKey,savedWords);persistWordSelection();renderVocabulary();renderSection(false);return;}const word=event.target.dataset.speak;if(word)speak(word);});
  $("#vocabList").addEventListener("change",event=>{const key=event.target.dataset.selectWord;if(!key)return;if(event.target.checked)selectedWordKeys.add(key);else selectedWordKeys.delete(key);persistWordSelection();$("#selectedWordCount").textContent=`已选 ${selectedWordKeys.size}`;});
  $("#vocabBulk").addEventListener("click",event=>{const action=event.target.dataset.vocabBulk;if(!action)return;const checked=action==="all";$$('[data-select-word]',$("#vocabList")).forEach(input=>{input.checked=checked;if(checked)selectedWordKeys.add(input.dataset.selectWord);else selectedWordKeys.delete(input.dataset.selectWord);});persistWordSelection();$("#selectedWordCount").textContent=`已选 ${selectedWordKeys.size}`;});
  $("#clearWords").addEventListener("click",()=>{if(confirm("确定清空全部生词吗？")){savedWords={};selectedWordKeys.clear();exportSelectedKeys.clear();handwritingSelectedKeys.clear();studySelectedKeys.clear();saveJSON(storageKey,savedWords);persistWordSelection();renderVocabulary();renderSection(false);}});

  $("#exportButton").addEventListener("click",openExportModal); $("#closeExport").addEventListener("click",closeExportModal); $("#confirmExport").addEventListener("click",confirmExport);
  $("#exportModal").addEventListener("click",event=>{if(event.target===$("#exportModal"))closeExportModal();});
  $("#exportWordList").addEventListener("change",event=>{if(event.target.type!=="checkbox")return;if(event.target.checked)exportSelectedKeys.add(event.target.value);else exportSelectedKeys.delete(event.target.value);updateExportCount();});

  document.addEventListener("click",event=>{const button=event.target.closest("[data-picker][data-action]");if(!button)return;const mapping={export:[$("#exportWordList"),exportSelectedKeys],handwriting:[$("#handwritingWordList"),handwritingSelectedKeys],study:[$("#studyWordList"),studySelectedKeys]};const target=mapping[button.dataset.picker];if(!target)return;setPickerSelection(target[0],target[1],button.dataset.action==="all");if(button.dataset.picker==="export")updateExportCount();});

  $("#openHandwriting").addEventListener("click",openHandwriting); $("#closeHandwriting").addEventListener("click",closeHandwriting); $("#startHandwriting").addEventListener("click",startHandwriting); $("#handwritingBack").addEventListener("click",backToHandwritingSetup);
  $("#handwritingWordList").addEventListener("change",event=>{if(event.target.type!=="checkbox")return;if(event.target.checked)handwritingSelectedKeys.add(event.target.value);else handwritingSelectedKeys.delete(event.target.value);});
  $("#dictationSpeak").addEventListener("click",()=>{const item=dictationWords()[dictationIndex];if(item)speak(item.word,item.info?.audio);});
  $("#revealAnswer").addEventListener("click",()=>{const a=$("#dictationAnswer");a.classList.toggle("hidden-answer");$("#revealAnswer").textContent=a.classList.contains("hidden-answer")?"显示答案":"隐藏答案";});
  $("#dictationKeyboardInput").addEventListener("input",saveCurrentTyping);
  $("#dictationKeyboardInput").addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();checkKeyboardAnswer();}});
  $("#checkKeyboardAnswer").addEventListener("click",checkKeyboardAnswer);
  $("#clearKeyboardAnswer").addEventListener("click",()=>{$("#dictationKeyboardInput").value="";$("#typingResult").textContent="";saveCurrentTyping();$("#dictationKeyboardInput").focus();});
  $("#prevWord").addEventListener("click",()=>moveDictation(-1)); $("#nextWord").addEventListener("click",()=>moveDictation(1)); $("#undoStroke").addEventListener("click",()=>{strokes.pop();redrawCanvas();saveCurrentWriting();}); $("#clearCanvas").addEventListener("click",()=>{strokes=[];redrawCanvas();saveCurrentWriting();}); $("#saveCanvas").addEventListener("click",downloadCanvas);

  $("#studyButton").addEventListener("click",openStudy); $("#closeStudy").addEventListener("click",closeStudy); $("#startStudy").addEventListener("click",startStudy); $("#studyBack").addEventListener("click",backToStudySetup);
  $("#studyWordList").addEventListener("change",event=>{if(event.target.type!=="checkbox")return;if(event.target.checked)studySelectedKeys.add(event.target.value);else studySelectedKeys.delete(event.target.value);});
  $("#studyAutoSpeak").addEventListener("change",event=>setStudyAutoSpeak(event.target.checked));
  $("#studyAutoToggle").addEventListener("click",()=>setStudyAutoSpeak(!studyAutoSpeak, !studyAutoSpeak));
  $("#studySpeak").addEventListener("click",()=>{const item=studyQueue[studyIndex];if(item)speak(item.word,item.info?.audio);}); $("#revealStudy").addEventListener("click",revealStudyMeaning); $("#studyAgain").addEventListener("click",()=>rateStudy(false)); $("#studyKnown").addEventListener("click",()=>rateStudy(true));
  $("#studyModal").addEventListener("click",event=>{if(event.target===$("#studyModal"))closeStudy();});

  canvas().addEventListener("pointerdown",startStroke); canvas().addEventListener("pointermove",moveStroke); canvas().addEventListener("pointerup",endStroke); canvas().addEventListener("pointercancel",endStroke);
  window.addEventListener("resize",()=>{if($("#handwritingModal").classList.contains("open"))resizeCanvas();}); window.addEventListener("scroll",updateProgress,{passive:true});
  document.addEventListener("keydown",event=>{if(event.key!=="Escape")return;closeDrawer();closeExportModal();closeStudy();closeHandwriting();});
})();
