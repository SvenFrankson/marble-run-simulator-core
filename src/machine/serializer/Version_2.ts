namespace MarbleRunSimulatorCore {

    export function SerializeV2(machine: Machine): IMachineData {

        let data: IMachineData = {
            n: machine.name,
            a: machine.author,
            v: 2
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

        data.d = dataString;

        return data;
    }
    
    export function DeserializeV2(machine: Machine, data: IMachineData, makeMiniature: boolean = false, canvas?: HTMLCanvasElement, miniatureProps?: IMiniatureProps): void {
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
                if (data.a) {
                    machine.author = data.a;
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

                if (makeMiniature) {
                    CommonAddBall(lines, x, y, z);
                }
                else if (machine) {
                    let ball = new Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);
                }
            }
            
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            //console.log("partCount = " + partCount);

            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = TrackNames[index].split("_")[0];
                //console.log("basename " + baseName);

                let pI = (parseInt(dataString.substring(pt, pt += 2), 36) - partOffset) * 2;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;

                //console.log("part ijk " + pI + " " + pJ + " " + pK);

                let w = (parseInt(dataString.substring(pt, pt += 1), 36)) * 2;
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
                    i: pI * 3,
                    j: pJ,
                    k: pK * 3,
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
                    },
                    miniatureProps
                );
            }
            else if (machine) {
                DeserializeAnte11AltitudeFix(machine);
            }
        }
    }
}