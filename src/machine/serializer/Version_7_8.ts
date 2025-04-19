namespace MarbleRunSimulatorCore {

    export function SerializeV8(machine: Machine): IMachineData {

        let data: IMachineData = {
            n: machine.name,
            a: machine.author,
            v: 8
        };

        let dataString = "";

        // Add ball count
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
                return name.startsWith(baseName);
            });
            if (index === - 1) {
                console.error("Error, can't find part index.");
                debugger;
            }
            partDataString += NToHex(index, 2);
            
            let pI = part.i + partOffset;
            let pJ = part.j + partOffset;
            let pK = part.k + partOffset;
            partDataString += NToHex(pI, 2);
            partDataString += NToHex(pJ, 2);
            partDataString += NToHex(pK, 2);

            partDataString += NToHex(part.w, 1);
            partDataString += NToHex(part.h, 1);
            partDataString += NToHex(part.d, 1);
            partDataString += NToHex(part.n, 1);
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

        data.d = dataString;

        return data;
    }
    
    export function DeserializeV78(machine: Machine, data: IMachineData, makeMiniature: boolean = false, canvas?: HTMLCanvasElement): void {
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
                x = x / 0.075 * tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                y = y / 0.03 * tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                z = z / 0.06 * tileDepth;

                let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);

                if (makeMiniature) {

                }
                else if (machine) {
                    let ball = new Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                    ball.materialIndex = materialIndex;
                }
            }
            
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("partCount = " + partCount);

            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = TrackNames[index].split("_")[0];

                let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;

                let correctedPI = pI * 3;
                let correctedPJ = - pK * 3;
                let correctedPK = -pJ;

                //console.log("part ijk " + pI + " " + pJ + " " + pK);

                let w = parseInt(dataString.substring(pt, pt += 1), 36);
                let h = parseInt(dataString.substring(pt, pt += 1), 36);
                let d = parseInt(dataString.substring(pt, pt += 1), 36);
                let n = parseInt(dataString.substring(pt, pt += 1), 36);
                let mirror = parseInt(dataString.substring(pt, pt += 1), 36);

                //console.log("part whdn " + w + " " + h + " " + d + " " + n);

                let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                //console.log(colorCount);
                let colors: number[] = [];
                for (let ii = 0; ii < colorCount; ii++) {
                    colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                }

                let prop: IMachinePartProp = {
                    i: correctedPI,
                    j: correctedPJ,
                    k: correctedPK,
                    l: w,
                    h: h,
                    d: d,
                    n: n,
                    s: TrackSpeed.Medium,
                    mirrorX: (mirror % 2) === 1,
                    mirrorZ: mirror >= 2,
                    c: colors
                }
                DeserializeAnte11Fix(baseName, prop);
                
                if (makeMiniature) {
                    AddLinesFromData(machine, baseName, prop, lines);
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

            let decorCount = parseInt(dataString.substring(pt, pt += 2), 36);
            for (let i = 0; i < decorCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                let f = false;
                if (data.v === 8) {
                    f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                }

                if (makeMiniature) {

                }
                else if (machine) {
                    let decor = new Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);
    
                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);
    
                    decor.setFlip(f);
                }
            }

            if (makeMiniature) {
                DrawMiniature(
                    lines,
                    canvas,
                    {
                        version: data.v,
                        partsCount: partCount,
                        ballsCount: ballCount,
                    }
                );
            }
            else if (machine) {
                DeserializeAnte11AltitudeFix(machine);
            }
        }
    }
}