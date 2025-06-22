namespace MarbleRunSimulatorCore {

    export function SerializeV12(machine: Machine): IMachineData {

        let data: IMachineData = {
            title: machine.name,
            author: machine.author,
            v: 12
        };

        let dataString = "";

        // Add ball count²
        dataString += NToHex(machine.balls.length, 2);
        for (let i = 0; i < machine.balls.length; i++) {
            let ball = machine.balls[i];
            let x = Math.round(ball.positionZero.x * 1000) + ballOffset;
            let y = Math.round(ball.positionZero.y * 1000) + ballOffset;
            let z = Math.round(ball.positionZero.z * 1000) + ballOffset;
            dataString += NToHex(x, 3);
            dataString += NToHex(y, 3);
            dataString += NToHex(z, 3);
            dataString += NToHex(ball.materialIndex, 2);
        }

        // Add parts count
        dataString += NToHex(machine.parts.length, 2);
        for (let i = 0; i < machine.parts.length; i++) {
            let partDataString = "";
            let part = machine.parts[i];
            let baseName = part.partName.split("_")[0];
            let index = TrackNames.findIndex((name) => {
                return name === baseName;
            });
            console.log(baseName + " " + index);
            if (index === - 1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += NToHex(index, 2);
            
            let pI = part.i + partOffset;
            let pJ = part.j + partOffset;
            let pK = part.k + partOffset;
            let pR = part.r;
            partDataString += NToHex(pI, 2);
            partDataString += NToHex(pJ, 2);
            partDataString += NToHex(pK, 2);
            partDataString += NToHex(pR, 1);

            partDataString += NToHex(part.w + partOffset, 2);
            partDataString += NToHex(part.h + partOffset, 2);
            partDataString += NToHex(part.d + partOffset, 2);
            partDataString += NToHex(part.n, 1);
            partDataString += NToHex(part.s, 1);
            let m = (part.mirrorX ? 1 : 0) + (part.mirrorZ ? 2 : 0);
            partDataString += NToHex(m, 1);

            let colourCount = part.colors.length;
            partDataString += NToHex(colourCount, 1);
            for (let j = 0; j < part.colors.length; j++) {
                let c = part.colors[j];
                partDataString += NToHex(c, 1);
            }
            //console.log("---------------------------");
            //console.log("serialize");
            //console.log(part);
            //console.log("into");
            //console.log(partDataString);
            //console.log("---------------------------");
            dataString += partDataString;
        }

        dataString += NToHex(machine.decors.length, 2);
        for (let i = 0; i < machine.decors.length; i++) {
            let decor = machine.decors[i];
            let x = Math.round(decor.position.x * 1000) + ballOffset;
            let y = Math.round(decor.position.y * 1000) + ballOffset;
            let z = Math.round(decor.position.z * 1000) + ballOffset;
            dataString += NToHex(x, 3);
            dataString += NToHex(y, 3);
            dataString += NToHex(z, 3);
            dataString += NToHex(decor.n, 2);
            dataString += NToHex(decor.flip ? 1 : 0, 1);
        }

        dataString += NToHex(machine.roomIndex, 3);

        dataString += NToHex(machine.sleepersMeshProp.grndAnchors ? 1 : 0, 1);
        dataString += NToHex(Math.floor(machine.sleepersMeshProp.grndAnchorsMaxY * 100), 3);
        dataString += NToHex(Math.floor(machine.sleepersMeshProp.spacing * 100), 3);

        data.content = dataString;

        data.sp = machine.sleepersMeshProp;

        return data;
    }
    
    export function DeserializeV12(machine: Machine, data: IMachineData, makeMiniature: boolean = false, canvas?: HTMLCanvasElement, miniatureProps?: IMiniatureProps): void {
        let dataString = data.d;
        if (!dataString) {
            dataString = data.content;
        }
        if (dataString) {
            if (makeMiniature) {

            }
            else if (machine) {
                if (data.n) {
                    machine.name = data.n;
                }
                if (data.title) {
                    machine.name = data.title;
                }
                if (data.a) {
                    machine.author = data.a;
                }
                if (data.author) {
                    machine.author = data.author;
                }
            
                machine.balls = [];
                machine.parts = [];
            }

            let lines: (MiniatureTrack | MiniatureShape)[] = [];

            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("ballCount = " + ballCount);

            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                if (makeMiniature) {
                    CommonAddBall(lines, x, y, z);
                }
                else if (machine) {
                    let ball = new Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);

                    ball.materialIndex = materialIndex;
                }
            }
            
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);

            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                if (index >= 0 && index < TrackNames.length) {
                    let baseName = TrackNames[index].split("_")[0];

                    let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let pR = parseInt(dataString.substring(pt, pt += 1), 36);

                    //console.log("part ijk " + pI + " " + pJ + " " + pK);

                    let l = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let h = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let d = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                    let n = parseInt(dataString.substring(pt, pt += 1), 36);
                    let s = parseInt(dataString.substring(pt, pt += 1), 36);
                    let mirror = parseInt(dataString.substring(pt, pt += 1), 36);

                    //console.log("part whdn " + w + " " + h + " " + d + " " + n);

                    let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                    //console.log(colorCount);
                    let colors: number[] = [];
                    for (let ii = 0; ii < colorCount; ii++) {
                        colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                    }

                    let prop: IMachinePartProp = {
                        i: pI,
                        j: pJ,
                        k: pK,
                        r: pR,
                        l: l,
                        h: h,
                        d: d,
                        n: n,
                        s: s,
                        mirrorX: (mirror % 2) === 1,
                        mirrorZ: mirror >= 2,
                        c: colors
                    }
                    
                    if (makeMiniature) {
                        let template = machine.templateManager.getTemplateByProp(baseName, prop);
                        if (template) {
                            // Now draw into the miniature from the template.
                            for (let t = 0; t < template.trackTemplates.length; t++) {
                                let trackTemplate = template.trackTemplates[t];
                                let drawnTrack: MiniatureTrack = new MiniatureTrack();
                                /*
                                for (let p = 0; p < trackTemplate.trackpoints.length; p++) {
                                    let point = trackTemplate.trackpoints[p].position.clone();
                                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                                    point.x += prop.i * tileSize;
                                    point.y += prop.k * tileHeight;
                                    point.z += prop.j * tileSize;
                                    if (Mummu.IsFinite(point)) {
                                        drawnTrack.push(point);
                                    }
                                    else {
                                        console.log("miniature fail for " + baseName);
                                    }
                                }
                                */
                                if (!trackTemplate.noMiniatureRender) {
                                    for (let p = 0; p < trackTemplate.interpolatedPoints.length; p++) {
                                        if (p % 3 === 0 || p === trackTemplate.interpolatedPoints.length - 1) {
                                            let point = trackTemplate.interpolatedPoints[p].clone();
                                            Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                                            point.x += prop.i * tileSize;
                                            point.y += prop.k * tileHeight;
                                            point.z += prop.j * tileSize;
                                            drawnTrack.dist = Math.min(drawnTrack.dist, point.x + point.z - 0.5 * point.y);
                                            if (Mummu.IsFinite(point)) {
                                                drawnTrack.points.push(point);
                                            }
                                            else {
                                                console.log("miniature fail for " + baseName);
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
                                for (let i = 0; i < shape.points.length; i++) {
                                    let point = shape.points[i].clone();
                                    Mummu.RotateInPlace(point, BABYLON.Axis.Y, - Math.PI * 0.5 * prop.r);
                                    point.x += prop.i * tileSize;
                                    point.y += prop.k * tileHeight;
                                    point.z += prop.j * tileSize;
                                    drawnShape.dist = Math.min(drawnShape.dist, point.x + point.z - 0.5 * point.y);
                                    if (Mummu.IsFinite(point)) {
                                        drawnShape.points.push(point);
                                    }
                                }
                                if (drawnShape.points.length > 0) {
                                    lines.push(drawnShape);
                                }
                            }
                        }
                        else {
                            console.log("can't find template for " + baseName);
                        }
                    }
                    else if (machine) {
                        let track = machine.trackFactory.createTrackBaseName(baseName, prop);
                        if (track) {
                            machine.parts.push(track);
                        }
                        else {
                            console.warn("failed to createTrackBaseName");
                            console.log(baseName);
                            console.log(prop);
                        }
                    }
                }
            }

            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;

                let n = parseInt(dataString.substring(pt, pt += 2), 36);
                let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;

                if (makeMiniature) {

                }
                else if (machine) {
                    let decor = new Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);

                    decor.setFlip(f);
                    decor.setN(n);
                }
            }

            let roomIndex = parseInt(dataString.substring(pt, pt += 3), 36);
            let grndAnchors = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
            let grndAnchorsMaxY = parseInt(dataString.substring(pt, pt += 3), 36) / 100;
            let spacing = parseInt(dataString.substring(pt, pt += 3), 36) / 100;

            if (makeMiniature) {
                DrawMiniature(
                    lines,
                    canvas,
                    {
                        version: data.v,
                        partsCount: partCount,
                        ballsCount: ballCount,
                    },
                    miniatureProps
                );
            }
            else if (machine) {
                machine._roomIndex = roomIndex;
                machine.sleepersMeshProp = {
                    grndAnchors: grndAnchors,
                    grndAnchorsMaxY: grndAnchorsMaxY,
                    spacing: spacing
                }
            }
        }
    }
}