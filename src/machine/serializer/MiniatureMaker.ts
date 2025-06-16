namespace MarbleRunSimulatorCore {

    export interface IMachineMiniatureData {
        version?: number;
        ballsCount?: number;
        partsCount?: number;
        backgroundColor?: string;
    }

    export interface IMiniatureProps {
        size?: number;
        backgroundColor?: string;
        showGround?: boolean;
        showInfoBox?: boolean;
    }

    export function AddLinesFromData(machine: Machine, baseName: string, prop: IMachinePartProp, lines: (MiniatureTrack | MiniatureShape)[]): void {
        let template = machine.templateManager.getTemplateByProp(baseName, prop);
        if (template) {
            // Now draw into the miniature from the template.
            for (let t = 0; t < template.trackTemplates.length; t++) {
                let trackTemplate = template.trackTemplates[t];
                let drawnTrack: MiniatureTrack = new MiniatureTrack();
                if (!trackTemplate.noMiniatureRender) {
                    for (let p = 0; p < trackTemplate.interpolatedPoints.length; p++) {
                        if (p % 3 === 0 || p === trackTemplate.interpolatedPoints.length - 1) {
                            let point = trackTemplate.interpolatedPoints[p].clone();
                            Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                            point.x += prop.i * tileSize;
                            point.y += prop.k * tileHeight;
                            point.z += prop.j * tileSize;
                            drawnTrack.dist = Math.min(drawnTrack.dist, point.x + point.z - point.y);
                            if (Mummu.IsFinite(point)) {
                                drawnTrack.points.push(point);
                            }
                            else {
                                console.log("miniature fail for " + baseName);
                                debugger;
                            }
                        }
                    }
                }
                if (drawnTrack.points.length > 0) {
                    lines.push(drawnTrack);
                }
            }
            for (let j = 0; j < template.miniatureShapes.length; j++) {
                let shape = template.miniatureShapes[j];
                let drawnShape: MiniatureShape = new MiniatureShape();
                drawnShape.fill = shape.fill;
                for (let i = 0; i < shape.points.length; i++) {
                    let point = shape.points[i].clone();
                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                    point.x += prop.i * tileSize;
                    point.y += prop.k * tileHeight;
                    point.z += prop.j * tileSize;
                    if (Mummu.IsFinite(point)) {
                        drawnShape.points.push(point);
                    }
                }
                if (drawnShape.points.length > 0) {
                    let center = shape.center.clone();
                    Mummu.RotateInPlace(center, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                    center.x += prop.i * tileSize;
                    center.y += prop.k * tileHeight;
                    center.z += prop.j * tileSize;
                    drawnShape.dist = center.x + center.z - center.y;

                    lines.push(drawnShape);
                }
            }
        }
        else {
            console.log("can't find template for " + baseName);
        }
    }

    export function CommonAddBall(lines: (MiniatureTrack | MiniatureShape)[], x: number, y: number, z: number): void {      
        x -= 0.01;
        y += 0.01;
        z -= 0.01;  
        let ballShape = MiniatureShape.MakeNGon(new BABYLON.Vector3(x, y, z), 0.011, new BABYLON.Vector3(-1, 1, -1), 16, false);
        ballShape.dist = x + z - y;
        lines.push(ballShape);
    }

    export function DrawMiniature(lines: (MiniatureTrack | MiniatureShape)[], canvas: HTMLCanvasElement, data: IMachineMiniatureData, miniatureProps?: IMiniatureProps): void {
        if (!data) {
            data = {};
        }
        if (!miniatureProps) {
            miniatureProps = {};
        }

        let color4White = new BABYLON.Color4(1, 1, 1, 1);
        let backGroundColor = BABYLON.Color4.FromHexString("#103c6fff");
        if (data.backgroundColor) {
            backGroundColor = BABYLON.Color4.FromHexString(data.backgroundColor);
        }
        if (miniatureProps.backgroundColor) {
            backGroundColor = BABYLON.Color4.FromHexString(miniatureProps.backgroundColor);
        }
        let size = 256;
        if (isFinite(miniatureProps.size)) {
            size = miniatureProps.size;
        }

        let showGround = miniatureProps.showGround;
        let showInfo = miniatureProps.showInfoBox;

        let picMargin = size / 20;
        let picSizeNoMargin = size - 2 * picMargin;
        let lineWidth = 1;
        canvas.width = size;
        canvas.height = size;

        let backGroundColorHex = backGroundColor.toHexString();
        let backGroundColorHexNoAlpha = backGroundColorHex.substring(0, 7) + "ff";
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
            my = (size - h / s * picSizeNoMargin) * 0.5;
        }
        else if (h > w) {
            mx = (size - w / s * picSizeNoMargin) * 0.5;
        }

        if (showGround) {
            let framePoints = [
                new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMin.z - 0.01),
                new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMin.z - 0.01),
                new BABYLON.Vector3(aabbMax.x + 0.01, aabbMin.y, aabbMax.z + 0.01),
                new BABYLON.Vector3(aabbMin.x - 0.01, aabbMin.y, aabbMax.z + 0.01)
            ]
            let cFrameLine = BABYLON.Color4.Lerp(backGroundColor, color4White, 0.5);

            context.beginPath();
            let p0 = framePoints[0];
            let x = (vToX(p0) - abstractPixelXMin) / s * picSizeNoMargin + mx;
            let y = (vToY(p0) - abstractPixelYMin) / s * picSizeNoMargin + my;
            context.moveTo(x - 2, size - y - 2);
            for (let j = 1; j < framePoints.length; j++) {
                let p = framePoints[j];
                let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
                context.lineTo(x - 2, size - y - 2);
            }
            context.closePath();
            context.strokeStyle = cFrameLine.toHexString();
            context.lineWidth = 1;
            context.stroke();

            let cFrameBackground = BABYLON.Color4.Lerp(backGroundColor, color4White, 0.05);
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
                context.moveTo(x - 2, size - y - 2);
                x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
                context.lineTo(x - 2, size - y - 2);

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
                context.moveTo(x - 2, size - y - 2);
                x = (vToX(p1) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                y = (vToY(p1) - abstractPixelYMin) / s * picSizeNoMargin + my;
                context.lineTo(x - 2, size - y - 2);

                context.strokeStyle = cFrameLine.toHexString();
                context.lineWidth = 1;
                context.stroke();
            }
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
            context.moveTo(x - 2, size - y - 2);
            for (let j = 1; j < line.points.length; j++) {
                let p = line.points[j];
                let x = (vToX(p) - abstractPixelXMin) / s * picSizeNoMargin + mx;
                let y = (vToY(p) - abstractPixelYMin) / s * picSizeNoMargin + my;
                normalizedH += p.y;
                //console.log("p " + x + " " + y);
                context.lineTo(x - 2, size - y - 2);
            }
            normalizedH = normalizedH / line.points.length;
            normalizedH = (normalizedH - aabbMin.y) / (aabbMax.y - aabbMin.y);
            let f = normalizedH * 0.8 + 0.2;
            if (line instanceof MiniatureTrack) {
                let c = BABYLON.Color4.Lerp(backGroundColor, color4White, f);
                context.strokeStyle = c.toHexString();
                context.stroke();
            
                context.lineWidth = 3 * lineWidth;
                context.strokeStyle = backGroundColorHexNoAlpha;
                context.stroke();
            }
            else if (line instanceof MiniatureShape) {
                let c = BABYLON.Color4.Lerp(backGroundColor, color4White, 1);
                context.closePath();
                context.strokeStyle = c.toHexString();
                context.lineWidth = lineWidth;
                context.stroke();

                if (line.fill) {
                    c = BABYLON.Color4.Lerp(backGroundColor, color4White, 0.7 * f);
                    context.fillStyle = c.toHexString();
                    context.fill();
                }
            }
        }

        if (showInfo) {
            let fontSize = Math.floor(size / 20);
            context.font = fontSize.toFixed(0) + "px monospace";
            let c = BABYLON.Color4.Lerp(backGroundColor, color4White, 0.7);
            context.fillStyle = c.toHexString();
            context.lineWidth = 1;
            context.strokeStyle = c.toHexString();
            context.strokeRect(- 0.5, - 0.5, Math.floor(6.5 * fontSize), Math.floor(3.5 * fontSize));
            if (isFinite(data.version)) {
                let versionText = "v" + data.version.toFixed(0)
                context.fillText(versionText, Math.floor(size - 0.5 * fontSize - context.measureText(versionText).width), Math.floor(size - 0.5 * fontSize));
            }
            if (isFinite(data.partsCount)) {
                context.fillText("parts " + data.partsCount.toFixed(0).padStart(3, " "), Math.floor(0.5 * fontSize), Math.floor(1.5 * fontSize));
            }
            if (isFinite(data.ballsCount)) {
                context.fillText("balls " + data.ballsCount.toFixed(0).padStart(3, " "), Math.floor(0.5 * fontSize), Math.floor(2.5 * fontSize));
            }
        }
    }
}