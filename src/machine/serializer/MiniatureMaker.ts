namespace MarbleRunSimulatorCore {

    export function DrawMiniature(lines: (MiniatureTrack | MiniatureShape)[], canvas: HTMLCanvasElement): void {
        let picSize = 512;
        let picMargin = picSize / 20;
        let picSizeNoMargin = picSize - 2 * picMargin;
        let lineWidth = 2;
        canvas.width = picSize;
        canvas.height = picSize;

        let backGroundColor = BABYLON.Color3.FromHexString("#103c6f");
        let backGroundColorHex = backGroundColor.toHexString();
        let context = canvas.getContext("2d");
        context.fillStyle = backGroundColorHex;
        context.fillRect(0, 0, canvas.width, canvas.height);

        let xProjAxis = new BABYLON.Vector2(Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));
        let yProjAxis = new BABYLON.Vector2(0, 1);
        let zProjAxis = new BABYLON.Vector2(- Math.cos(Math.PI / 6), Math.sin(Math.PI / 6));

        let vToX = (v: BABYLON.Vector3) => {
            let x = xProjAxis.x * v.x + yProjAxis.x * v.y + zProjAxis.x * v.z;
            return x;
        }
        let vToY = (v: BABYLON.Vector3) => {
            let y = xProjAxis.y * v.x + yProjAxis.y * v.y + zProjAxis.y * v.z;
            return y;
        }

        let aabbMin = new BABYLON.Vector3(Infinity, Infinity, Infinity);
        let aabbMax = new BABYLON.Vector3(-Infinity, -Infinity, -Infinity);
        let abstractPixelXMin = Infinity;
        let abstractPixelXMax = - Infinity;
        let abstractPixelYMin = Infinity;
        let abstractPixelYMax = - Infinity;

        lines.sort((a, b) => { return b.dist - a.dist; });

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].points;
            for (let j = 0; j < line.length; j++) {
                let p = line[j];
                if (Mummu.IsFinite(p)) {
                    let abstractPixelX = vToX(p);
                    let abstractPixelY = vToY(p);
                    abstractPixelXMin = Math.min(abstractPixelXMin, abstractPixelX);
                    abstractPixelXMax = Math.max(abstractPixelXMax, abstractPixelX);
                    abstractPixelYMin = Math.min(abstractPixelYMin, abstractPixelY);
                    abstractPixelYMax = Math.max(abstractPixelYMax, abstractPixelY);
                    aabbMin = BABYLON.Vector3.Minimize(aabbMin, p);
                    aabbMax = BABYLON.Vector3.Maximize(aabbMax, p);
                }
            }
        }

        let w = abstractPixelXMax - abstractPixelXMin;
        let h = abstractPixelYMax - abstractPixelYMin;
        let s = Math.max(w, h);
        let mx = picMargin;
        let my = picMargin;
        if (w > h) {
            my = (picSize - h / s * picSizeNoMargin) * 0.5;
        }
        else if (h > w) {
            mx = (picSize - w / s * picSizeNoMargin) * 0.5;
        }

        let framePoints = [
            new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMin.z - 0.01),
            new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMin.z - 0.01),
            new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMax.z + 0.01),
            new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMax.z + 0.01)
        ]
        let cFrameLine = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.5);

        context.beginPath();
        let p0 = framePoints[0];
        let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
        let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
        context.moveTo(x - 2, picSize - y - 2);
        for (let j = 1; j < framePoints.length; j++) {
            let p = framePoints[j];
            let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);
        }
        context.closePath();
        context.strokeStyle = cFrameLine.toHexString();
        context.lineWidth = 1;
        context.stroke();

        let cFrameBackground = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.05);
        context.fillStyle = cFrameBackground.toHexString();
        context.fill();

        let dist01 = BABYLON.Vector3.Distance(framePoints[0], framePoints[1]);
        let dist03 = BABYLON.Vector3.Distance(framePoints[0], framePoints[3]);
        let count01 = 10;
        let count03 = 10;
        if (dist01 > dist03) {
            count03 = Math.round(dist03 / (dist01 / count01));
        }
        if (dist03 > dist01) {
            count01 = Math.round(dist01 / (dist03 / count03));
        }

        for (let i = 1; i < count01; i++) {
            let f = i / count01;
            let p0 = BABYLON.Vector3.Lerp(framePoints[0], framePoints[1], f);
            let p1 = BABYLON.Vector3.Lerp(framePoints[3], framePoints[2], f);
            
            context.beginPath();
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.moveTo(x - 2, picSize - y - 2);
            x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);

            context.strokeStyle = cFrameLine.toHexString();
            context.lineWidth = 1;
            context.stroke();
        }

        for (let i = 1; i < count03; i++) {
            let f = i / count03;
            
            let p0 = BABYLON.Vector3.Lerp(framePoints[0], framePoints[3], f);
            let p1 = BABYLON.Vector3.Lerp(framePoints[1], framePoints[2], f);
            
            context.beginPath();
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.moveTo(x - 2, picSize - y - 2);
            x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.lineTo(x - 2, picSize - y - 2);

            context.strokeStyle = cFrameLine.toHexString();
            context.lineWidth = 1;
            context.stroke();
        }

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            context.lineWidth = 5 * lineWidth;
            let normalizedH = 0;
            context.beginPath();
            let p0 = line.points[0];
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            normalizedH = p0.y;
            //console.log("p0 " + x + " " + y);
            context.moveTo(x - 2, picSize - y - 2);
            for (let j = 1; j < line.points.length; j++) {
                let p = line.points[j];
                let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
                normalizedH += p.y;
                //console.log("p " + x + " " + y);
                context.lineTo(x - 2, picSize - y - 2);
            }
            normalizedH = normalizedH / line.points.length;
            normalizedH = (normalizedH - aabbMin.y) / (aabbMax.y - aabbMin.y);
            let f = normalizedH * 0.8 + 0.2;
            if (line instanceof MiniatureTrack) {
                let c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), f);
                context.strokeStyle = c.toHexString();
                context.stroke();
            
                context.lineWidth = 3 * lineWidth;
                context.strokeStyle = backGroundColorHex;
                context.stroke();
            }
            else if (line instanceof MiniatureShape) {
                let c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 1);
                context.closePath();
                context.strokeStyle = c.toHexString();
                context.lineWidth = lineWidth;
                context.stroke();

                c = BABYLON.Color3.Lerp(backGroundColor, BABYLON.Color3.White(), 0.7 * f);
                context.fillStyle = c.toHexString();
                context.fill();
            }
        }
    }
}