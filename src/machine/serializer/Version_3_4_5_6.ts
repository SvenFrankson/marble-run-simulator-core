namespace MarbleRunSimulatorCore {

    export function SerializeV3456(machine: Machine, version: number): IMachineData {

        let data: IMachineData = {
            n: machine.name,
            a: machine.author,
            v: version
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
            if (version === 4 || version >= 6) {
                dataString += NToHex(ball.materialIndex, 2);
            }
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
    
    export function DeserializeV3456(machine: Machine, data: IMachineData): void {
        let dataString = data.d;
        if (dataString) {
            if (data.n) {
                machine.name = data.n;
            }
            if (data.a) {
                machine.author = data.a;
            }
            if (data.r) {
                machine._roomIndex = data.r;
            }
            else {
                machine._roomIndex = 0;
            }
        
            machine.balls = [];
            machine.parts = [];

            let pt = 0;
            let ballCount = parseInt(dataString.substring(pt, pt += 2), 36);

            for (let i = 0; i < ballCount; i++) {
                let x = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                x = x / 0.075 * tileWidth;
                let y = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                y = y / 0.03 * tileHeight;
                let z = (parseInt(dataString.substring(pt, pt += 3), 36) - ballOffset) / 1000;
                z = z / 0.06 * tileDepth;

                let ball = new Ball(new BABYLON.Vector3(x, y, z), machine);
                machine.balls.push(ball);

                if (data.v === 4 || data.v >= 6) {
                    let materialIndex = parseInt(dataString.substring(pt, pt += 2), 36);
                    ball.materialIndex = materialIndex;
                }
            }
            
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);

            for (let i = 0; i < partCount; i++) {
                let index = parseInt(dataString.substring(pt, pt += 2), 36);
                let baseName = TrackNames[index].split("_")[0];

                let pI = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                let pJ = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;
                let pK = parseInt(dataString.substring(pt, pt += 2), 36) - partOffset;

                let correctedPI = pI * 3;
                let correctedPJ = - pK * 3;
                let correctedPK = -pJ;

                let w = parseInt(dataString.substring(pt, pt += 1), 36);
                let h = parseInt(dataString.substring(pt, pt += 1), 36);
                let d = parseInt(dataString.substring(pt, pt += 1), 36);
                let n = parseInt(dataString.substring(pt, pt += 1), 36);
                let mirror = parseInt(dataString.substring(pt, pt += 1), 36);

                let colorCount = parseInt(dataString.substring(pt, pt += 1), 36);
                let colors: number[] = [];
                for (let ii = 0; ii < colorCount; ii++) {
                    colors[ii] = parseInt(dataString.substring(pt, pt += 1), 36);
                }

                if (data.v < 5) {
                    if (baseName === "uturn") {
                        if (d === 2) {
                            if ((mirror % 2) === 1) {
                                pI++;
                            }
                        }
                        if (d === 6 || d === 7) {
                            if ((mirror % 2) === 1) {
                                pI--;
                            }
                        }
                    }
                }

                let prop: IMachinePartProp = {
                    i: correctedPI,
                    j: correctedPJ,
                    k: correctedPK,
                    l: w,
                    h: h,
                    d: d,
                    n: n,
                    mirrorX: (mirror % 2) === 1,
                    mirrorZ: mirror >= 2,
                    c: colors
                }
                DeserializeAnte11Fix(baseName, prop);
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

            let minK = Infinity;
            for (let i = 0; i < machine.parts.length; i++) {
                let part = machine.parts[i];
                if (part.downwardYExtendable) {
                    minK = Math.min(minK, part.k - part.h);
                }
                else {
                    minK = Math.min(minK, part.k);
                }
            }

            if (isFinite(minK) && minK != 0) {
                for (let i = 0; i < machine.parts.length; i++) {
                    let part = machine.parts[i];
                    part.setK(part.k - minK, true);
                }
                for (let i = 0; i < machine.balls.length; i++) {
                    let ball = machine.balls[i];
                    ball.setPositionZero(ball.positionZero.subtract(new BABYLON.Vector3(0, minK * tileHeight, 0)));
                }
            }
        }
    }
}