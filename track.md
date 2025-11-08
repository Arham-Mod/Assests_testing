<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Oval Race Track</title>
    <style>
        body {
            margin: 0;
            padding: 20px;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            background: #1a1a1a;
        }
        canvas {
            border: 2px solid #333;
            background: #2a2a2a;
        }
    </style>
</head>
<body>
    <canvas id="trackCanvas" width="800" height="600"></canvas>

    <script>
        const canvas = document.getElementById('trackCanvas');
        const ctx = canvas.getContext('2d');

        function drawOvalTrack() {
            const centerX = canvas.width / 2;
            const centerY = canvas.height / 2;
            const radiusX = 300;
            const radiusY = 200;
            const trackWidth = 125;

            // Draw outer edge of track
            ctx.strokeStyle = '#555';
            ctx.lineWidth = trackWidth;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Draw inner track surface
            ctx.strokeStyle = '#3a3a3a';
            ctx.lineWidth = trackWidth - 10;
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Draw center line (dashed)
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 2;
            ctx.setLineDash([15, 10]);
            ctx.beginPath();
            ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw start/finish line
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(centerX + radiusX +60, centerY - 0);
            ctx.lineTo(centerX + radiusX - 60, centerY + 0);
            ctx.stroke();
        }

        // Draw the track
        drawOvalTrack();
    </script>
</body>
</html>