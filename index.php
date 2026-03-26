<?php
// ── DynamoDB client (Lumos portal infrastructure) ─────────────────────────────
require '/var/www/llp/functions.php';
require '/var/www/llp/Aws/config.php';
// $client is now available

const TABLE = 'vibe_coding_dev';

// ── Sanitise StudentID from cookie ────────────────────────────────────────────
$rawId     = isset($_COOKIE['StudentID']) ? trim($_COOKIE['StudentID']) : '';
$studentId = preg_replace('/[^a-zA-Z0-9_\-]/', '', $rawId);

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

    $pk      = $studentId . '_ela-quest';
    $scorePk = $studentId . '_ela-quest-score';

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
                    'gameId'     => ['S' => 'ela-quest']
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
                    'gameId'         => ['S' => 'ela-quest']
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
                    ':suf' => ['S' => '_ela-quest-score'],
                    ':gid' => ['S' => 'ela-quest']
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
if (empty($studentId)) {
    http_response_code(403);
    echo '<!DOCTYPE html><html><body style="font-family:sans-serif;text-align:center;padding:60px">
        <h2>⚠️ Session Expired</h2>
        <p>Please log in to the Lumos Learning portal to play ELA Quest.</p>
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

  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js"></script>
  <script type="module" src="js/main.js"></script>
</body>
</html>
