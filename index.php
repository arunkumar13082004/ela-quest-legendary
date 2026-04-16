<?php
// ── DynamoDB client (Lumos portal infrastructure) ─────────────────────────────
require '/var/www/llp/functions.php';
require '/var/www/llp/Aws/config.php';
// $client is now available

const TABLE = 'vibe_coding_dev';

// ── Sanitise StudentID from cookie ────────────────────────────────────────────
$rawId     = isset($_COOKIE['CurStudentID']) ? trim($_COOKIE['CurStudentID']) : '';
$studentId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $rawId);
$userType = isset($_COOKIE['userType']) ? trim($_COOKIE['userType']) : '';

// ─────────────────────────────────────────────────────────────────────────────
// API MODE — handle ?action=load | save | delete | scores | leaderboard
// Called by SaveSystem.js with fetch('index.php?action=...')
// ─────────────────────────────────────────────────────────────────────────────
$action = isset($_GET['action']) ? $_GET['action'] : '';

if ($action !== '') {
    header('Content-Type: application/json');
    header('X-Content-Type-Options: nosniff');

    if (empty($studentId)) {
        http_response_code(401);
        echo json_encode(['error' => 'No StudentID cookie.']);
        exit;
    }

    $pk      = $studentId . '_8';
    $scorePk = $studentId . '_8score';

    try {

        // ── GET progress ──────────────────────────────────────────────────────
        if ($action === 'load' && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $result = $client->getItem([
                'TableName' => TABLE,
                'Key'       => ['StudentID' => ['S' => $pk]]
            ]);
            if (empty($result['Item'])) {
                echo json_encode(null);
            } else {
                $i = $result['Item'];
                echo json_encode([
                    'player'     => json_decode($i['player']['S']     ?? '{}', true),
                    'progress'   => json_decode($i['progress']['S']   ?? '{}', true),
                    'difficulty' => json_decode($i['difficulty']['S'] ?? '{}', true),
                    'savedAt'    => $i['savedAt']['S'] ?? null
                ]);
            }
            exit;
        }

        // ── POST (save) progress ──────────────────────────────────────────────
        if ($action === 'save' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $body = json_decode(file_get_contents('php://input'), true);
            if (!isset($body['player'], $body['progress'])) {
                http_response_code(400);
                echo json_encode(['error' => 'Missing player or progress.']);
                exit;
            }
            $client->putItem([
                'TableName' => TABLE,
                'Item'      => [
                    'StudentID'  => ['S' => $pk],
                    'player'     => ['S' => json_encode($body['player'])],
                    'progress'   => ['S' => json_encode($body['progress'])],
                    'difficulty' => ['S' => json_encode($body['difficulty'] ?? [])],
                    'savedAt'    => ['S' => (new DateTime())->format(DateTime::ATOM)],
                    'gameId'     => ['S' => '8']
                ]
            ]);
            echo json_encode(['success' => true]);
            exit;
        }

        // ── DELETE progress (new game) ────────────────────────────────────────
        if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $client->deleteItem([
                'TableName' => TABLE,
                'Key'       => ['StudentID' => ['S' => $pk]]
            ]);
            echo json_encode(['success' => true]);
            exit;
        }

        // ── POST score (completed game) ───────────────────────────────────────
        if ($action === 'scores' && $_SERVER['REQUEST_METHOD'] === 'POST') {
            $body = json_decode(file_get_contents('php://input'), true);
            $client->putItem([
                'TableName' => TABLE,
                'Item'      => [
                    'StudentID'      => ['S' => $scorePk],
                    'studentId'      => ['S' => $studentId],
                    'gatesCompleted' => ['N' => strval((int)($body['gatesCompleted'] ?? 0))],
                    'totalStars'     => ['N' => strval((int)($body['totalStars']     ?? 0))],
                    'level'          => ['N' => strval((int)($body['level']          ?? 1))],
                    'timeMs'         => ['N' => strval((int)($body['timeMs']         ?? 0))],
                    'completedAt'    => ['S' => (new DateTime())->format(DateTime::ATOM)],
                    'gameId'         => ['S' => 'e8']
                ]
            ]);
            echo json_encode(['success' => true]);
            exit;
        }

        // ── GET leaderboard ───────────────────────────────────────────────────
        if ($action === 'leaderboard' && $_SERVER['REQUEST_METHOD'] === 'GET') {
            $result = $client->scan([
                'TableName'                 => TABLE,
                'FilterExpression'          => 'contains(StudentID, :suf) AND gameId = :gid',
                'ExpressionAttributeValues' => [
                    ':suf' => ['S' => '_8score'],
                    ':gid' => ['S' => '8']
                ],
                'ProjectionExpression'      => 'studentId, gatesCompleted, totalStars, #lvl, timeMs',
                'ExpressionAttributeNames'  => ['#lvl' => 'level']
            ]);
            $rows = array_map(fn($i) => [
                'studentId'      => $i['studentId']['S']           ?? 'unknown',
                'gatesCompleted' => (int)($i['gatesCompleted']['N'] ?? 0),
                'totalStars'     => (int)($i['totalStars']['N']     ?? 0),
                'level'          => (int)($i['level']['N']          ?? 1),
                'timeMs'         => (int)($i['timeMs']['N']         ?? 0)
            ], $result['Items'] ?? []);
            usort($rows, fn($a, $b) =>
                $b['gatesCompleted'] - $a['gatesCompleted']
                ?: $b['totalStars']  - $a['totalStars']
                ?: $a['timeMs']      - $b['timeMs']
            );
            echo json_encode(['leaderboard' => array_slice($rows, 0, 20)]);
            exit;
        }

        http_response_code(400);
        echo json_encode(['error' => 'Unknown action.']);

    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'DB error: ' . $e->getMessage()]);
    }
    exit;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE MODE — serve the game HTML
// ─────────────────────────────────────────────────────────────────────────────
if (empty($studentId)) // || $userType === '' || strtolower($userType) !== 'student' 
{
    http_response_code(403);
    echo '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>⚠️ Session Expired</h2>
        <p>Please log in to the Lumos Learning Student portal to play ELA Quest.</p>
    </body></html>';
    exit;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ELA Quest – Legendary Adventure</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@500;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <script>
    window.STUDENT_ID = <?php echo json_encode($studentId); ?>;
  </script>

  <div id="game-shell">
    <div id="phaser-root" aria-label="ELA Quest game canvas"></div>
    <div id="rotate-device">
      <h2>Rotate Device</h2>
      <p>Please switch to landscape mode for the best experience.</p>
    </div>
  </div>

  <!-- ── Study Notes: Gate Button Bar ──────────────────────────────────── -->
  <div id="study-bar" role="navigation" aria-label="Study notes shortcuts">
    <button class="snote-btn" data-gate="1">📗 Vocab</button>
    <button class="snote-btn" data-gate="2">📘 Main Idea</button>
    <button class="snote-btn" data-gate="3">📙 Figurative</button>
    <button class="snote-btn" data-gate="4">📓 Story Order</button>
    <button class="snote-btn" data-gate="5">📕 Evidence</button>
  </div>

  <!-- ── Study Notes: Modal Overlay ────────────────────────────────────── -->
  <div id="snotes-overlay" class="lm-hidden" role="dialog" aria-modal="true" aria-labelledby="snotes-title">
    <div id="snotes-card">
      <div id="snotes-header">
        <h2 id="snotes-title"></h2>
        <button id="snotes-close" aria-label="Close study notes">✕</button>
      </div>
      <div id="snotes-body"></div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script type="module" src="js/main.js"></script>

  <!-- ── Study Notes: Interactivity ────────────────────────────────────── -->
  <script type="module">
    import { STUDY_NOTES } from './js/data/StudyNotes.js';

    const studyBar = document.getElementById('study-bar');
    const overlay = document.getElementById('snotes-overlay');
    const header  = document.getElementById('snotes-header');
    const title   = document.getElementById('snotes-title');
    const body    = document.getElementById('snotes-body');
    const closeBtn = document.getElementById('snotes-close');

    // ── Show study bar only on the entry page (IntroScene) ───────────────
    // The game always starts on IntroScene, so show the bar immediately.
    // Once the game systems are ready we subscribe to ui:toggle to hide the
    // bar when the player navigates to any other scene (toggle=true) and to
    // show it again if IntroScene becomes active (toggle=false).
    studyBar.classList.add('visible');

    (function waitForSystems(retries) {
      if (window.elaSystems && window.elaSystems.events) {
        window.elaSystems.events.on('ui:toggle', (visible) => {
          // visible=true  means a non-intro scene is active → hide bar
          // visible=false means IntroScene is active → show bar
          if (visible) {
            studyBar.classList.remove('visible');
            closeNotes();
          } else {
            studyBar.classList.add('visible');
          }
        });
      } else if (retries > 0) {
        setTimeout(() => waitForSystems(retries - 1), 100);
      } else {
        // Game failed to initialize within 10s — hide the bar to avoid clutter
        studyBar.classList.remove('visible');
      }
    })(100); // 100 retries × 100ms = 10s max

    // ── Open modal when a gate button is clicked ──────────────────────────
    document.querySelectorAll('.snote-btn').forEach(btn => {
      btn.addEventListener('click', () => openNotes(btn.dataset.gate));
    });

    // ── Close modal ───────────────────────────────────────────────────────
    closeBtn.addEventListener('click', closeNotes);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeNotes(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotes(); });

    function openNotes(gateId) {
      const notes = STUDY_NOTES[gateId];
      if (!notes) return;

      title.textContent = notes.title;
      header.style.background = notes.color;
      body.innerHTML = renderBody(notes.sections);
      overlay.classList.remove('lm-hidden');
      body.scrollTop = 0;
      closeBtn.focus();
    }

    function closeNotes() {
      overlay.classList.add('lm-hidden');
    }

    // ── Render all sections into HTML ─────────────────────────────────────
    function renderBody(sections) {
      return sections.map(s => `
        <div class="sn-section">
          <h3 class="sn-section-heading">${s.heading}</h3>
          ${renderSection(s)}
        </div>`).join('');
    }

    function renderSection(s) {
      switch (s.type) {
        case 'text':           return renderText(s);
        case 'tips':           return renderTips(s);
        case 'vocab-list':     return renderVocab(s);
        case 'examples':       return renderExamples(s);
        case 'fig-types':      return renderFigTypes(s);
        case 'story-parts':    return renderStoryParts(s);
        case 'story-examples': return renderStoryExamples(s);
        case 'evidence-compare': return renderEvidenceCompare(s);
        default:               return '';
      }
    }

    function renderText(s) {
      return `<p class="sn-text">${s.content}</p>`;
    }

    function renderTips(s) {
      return `<ul class="sn-tips">${s.items.map(i => `<li>${i}</li>`).join('')}</ul>`;
    }

    function renderVocab(s) {
      return `<div class="sn-vocab-grid">${s.words.map(w =>
        `<div class="sn-vocab-item">
          <span class="sn-vocab-word">${esc(w.word)}</span>
          <span class="sn-vocab-def">– ${esc(w.definition)}</span>
        </div>`).join('')}</div>`;
    }

    function renderExamples(s) {
      return `<div class="sn-examples">${s.items.map(e =>
        `<div class="sn-example-item">
          <div class="sn-example-title">${esc(e.title)}</div>
          <div class="sn-example-idea">${esc(e.idea)}</div>
        </div>`).join('')}</div>`;
    }

    function renderFigTypes(s) {
      return `<div class="sn-fig-types">${s.types.map(t =>
        `<div class="sn-fig-item">
          <div class="sn-fig-name">${esc(t.icon)} ${esc(t.name)}</div>
          <div class="sn-fig-desc">${t.description}</div>
          <div class="sn-fig-example">${t.example}</div>
          <div class="sn-fig-tip">💡 ${esc(t.tip)}</div>
        </div>`).join('')}</div>`;
    }

    function renderStoryParts(s) {
      return `<div class="sn-story-parts">${s.parts.map(p =>
        `<div class="sn-story-part">
          <div class="sn-story-part-name">${p.name}</div>
          <div class="sn-story-part-desc">${p.description}</div>
          <div class="sn-story-part-ex">${esc(p.example)}</div>
        </div>`).join('')}</div>`;
    }

    function renderStoryExamples(s) {
      return `<div class="sn-story-examples">${s.items.map(e =>
        `<div class="sn-story-ex-item">
          <div class="sn-story-ex-title">📖 ${esc(e.title)}</div>
          <div class="sn-story-row"><span class="sn-story-label">Setup:</span>      <span class="sn-story-val">${esc(e.setup)}</span></div>
          <div class="sn-story-row"><span class="sn-story-label">Problem:</span>    <span class="sn-story-val">${esc(e.problem)}</span></div>
          <div class="sn-story-row"><span class="sn-story-label">Climax:</span>     <span class="sn-story-val">${esc(e.climax)}</span></div>
          <div class="sn-story-row"><span class="sn-story-label">Resolution:</span> <span class="sn-story-val">${esc(e.resolution)}</span></div>
        </div>`).join('')}</div>`;
    }

    function renderEvidenceCompare(s) {
      return `<div class="sn-ev-items">${s.items.map(e =>
        `<div class="sn-ev-item">
          <div class="sn-ev-claim">Claim: ${esc(e.claim)}</div>
          <div class="sn-ev-good">${esc(e.evidence)}</div>
          <div class="sn-ev-bad">${esc(e.notEvidence)}</div>
        </div>`).join('')}</div>`;
    }

    // Escape user-facing text (data from our own StudyNotes.js — defense in depth)
    function esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }
  </script>
</body>
</html>