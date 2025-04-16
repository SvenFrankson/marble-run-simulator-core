namespace MarbleRunSimulatorCore {

    export function SerializeV11(machine: Machine): IMachineData {

        let data: IMachineData = {
            n: machine.name,
            a: machine.author,
            v: 11,
            r: machine.roomIndex
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

        data.d = dataString;

        data.sp = machine.sleepersMeshProp;

        return data;
    }
    
    export function DeserializeAnte11Fix(baseName: string, prop: IMachinePartProp) {
        if (!isFinite(prop.r)) {
            prop.r = 0;
        }
        if (baseName === "shooter") {
            prop.k -= prop.h + 1;
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "elevator") {
            prop.k -= prop.h + 1;
            if (prop.mirrorX) {
                prop.i += 3;
                prop.r = 2;
            }
        }
        if (baseName === "uturn") {
            let newL = (prop.d - 1) * 3;
            if (prop.mirrorX) {
                if (prop.d === 2) {
                    prop.i += 1;
                }
                if (prop.d === 3) {
                    prop.i += 4;
                }
                if (prop.d === 4) {
                    prop.i += 7;
                }
                if (prop.d === 5) {
                    prop.i += 10;
                }
                if (prop.d === 6) {
                    prop.i += 13;
                }
                if (prop.d === 7) {
                    prop.i += 16;
                }

                if (prop.mirrorZ) {
                    prop.k -= prop.h;
                }
                else {
                    prop.h = - prop.h;
                }

                prop.r = 2;
            }
            else {
                prop.i--;
                prop.j -= newL;
                if (prop.mirrorZ) {
                    prop.h = - prop.h;
                }
                else {
                    prop.k -= prop.h;
                }
            }
            prop.l = newL;
        }
        if (baseName === "wall") {
            let newL = (prop.d - 1) * 3;
            if (prop.mirrorX) {
                prop.i += 4;
                prop.r = 2;
            }
            else {
                prop.i--;
                prop.j -= newL;
            }
            prop.k -= prop.h;
            prop.l = newL;
        }
        if (baseName === "loop") {
            //console.log("n " + prop.n);
            //console.log("mirrorX " + prop.mirrorX);
            //console.log("mirrorZ " + prop.mirrorZ);
            prop.l = prop.l * 3;
            prop.d = (prop.d - 1) * 3;
            prop.k -= 4;
            if (prop.mirrorX) {
                if (prop.mirrorZ) {

                }
                else {
                    prop.i--;
                    prop.j -= prop.d;
                }
            }
            else {
                prop.i--;
                if (prop.mirrorZ) {

                }
                else {
                    prop.d = - prop.d;
                }
            }
        }
        if (baseName === "split") {
            prop.k -= 1;
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "stairway") {
            prop.l = prop.l * 3;
            prop.h = prop.h - 2;
            prop.k -= prop.h;

            if (prop.mirrorX) {
                prop.r = 2;
                prop.i += prop.l - 3;
            }
        }
        if (baseName === "screw") {
            prop.l = prop.l * 3;
            prop.k -= prop.h;

            if (prop.mirrorX) {
                prop.r = 2;
                prop.i += prop.l - 3;
            }
        }
        if (baseName === "spiral") {
            prop.i--;
            prop.l = 3 * prop.l;
            if (prop.mirrorX) {
                if (prop.mirrorZ) {
                    prop.i += prop.l - 1;
                    prop.j -= prop.l;
                    prop.r = 2;
                }
                else {
                    prop.l = - prop.l;
                }
            }
            else {
                if (prop.mirrorZ) {
                    prop.r = 2;
                    prop.i += prop.l - 1;
                    prop.j -= prop.l;
                    prop.l = - prop.l;
                }
            }
        }
        if (baseName === "spiralUTurn") {
            prop.l = 3 * (prop.d - 1);
            if (prop.mirrorX) {
                if (prop.mirrorZ) {
                    prop.r = 2;
                    prop.i += prop.l - 2;
                    prop.j -= prop.l;
                    prop.l = - prop.l;
                }
                else {
                    prop.r = 2;
                    prop.i += prop.l + 1;
                }
            }
            else {
                prop.i--;
                if (prop.mirrorZ) {
                    prop.j -= prop.l;
                }
                else {
                    prop.l = - prop.l;
                }
            }
        }
        if (baseName === "speeder") {
            prop.l = 3;
            prop.i--;
        }
        if (baseName === "join") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "screen") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "start") {
            if (prop.mirrorX) {
                prop.r = 2;
            }
        }
        if (baseName === "jumper") {
            if (prop.mirrorX) {
                prop.i += 3;
                prop.r = 2;
            }
        }
        if (baseName === "forwardSplit") {
            if (prop.mirrorX) {
                prop.r = 2;
                prop.j -= 6;
            }
        }
        if (baseName === "uturnsharp") {
            prop.k -= prop.h;
            if (prop.mirrorX) {
                prop.r = 2;
                if (prop.h === 1) {
                    prop.i -= 2;
                }
                if (prop.h === 2) {
                    prop.i -= 2;
                }
                if (prop.h === 3) {
                    
                }
                else if (prop.h === 9) {
                    prop.i += 6;
                }
                else if (prop.h === 11) {
                    prop.i += 7;
                }
                else {
                    prop.i += 2 + Math.floor((prop.h + 1) / 5);
                }
            }
        }
        if (baseName === "ramp" || baseName === "piperamp" || baseName === "woodramp" || baseName === "wave") {
            prop.l = prop.l * 3;
            prop.d = (prop.d - 1) * 3;
            
            if (prop.mirrorX) {
                prop.i -= 1;
                prop.k -= prop.h;

                if (prop.mirrorZ) {
                    prop.d = - prop.d;
                }
                else {
                    prop.j -= prop.d;
                }
            }
            else {
                prop.i -= 1;
                prop.h = - prop.h;

                if (prop.mirrorZ) {
                    prop.j -= prop.d;
                }
                else {
                    prop.d = - prop.d;
                }
            }
        }
    }

    export function DeserializeAnte11AltitudeFix(machine: Machine): void {
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
                part.setK(part.k - minK);
            }
            for (let i = 0; i < machine.balls.length; i++) {
                let ball = machine.balls[i];
                ball.setPositionZero(ball.positionZero.subtract(new BABYLON.Vector3(0, minK * tileHeight, 0)));
            }
        }
    }

    export function DeserializeV11(machine: Machine, data: IMachineData, makeMiniature: boolean = false, canvas?: HTMLCanvasElement): void {
        let dataString = data.d;
        if (dataString) {
            if (data.n) {
                machine.name = data.n;
            }
            if (data.a) {
                machine.author = data.a;
            }
        
            machine.balls = [];
            machine.parts = [];

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

                }
                else {
                    let ball = new Ball(new BABYLON.Vector3(x, y, z), machine);
                    machine.balls.push(ball);

                    ball.materialIndex = materialIndex;
                }
            }
            
            let partCount = parseInt(dataString.substring(pt, pt += 2), 36);
            console.log("partCount = " + partCount);

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
                        AddLinesFromData(machine, baseName, prop, lines);
                    }
                    else {
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

                if (makeMiniature) {

                }
                else {
                    let decor = new Xylophone(machine);
                    decor.setPosition(new BABYLON.Vector3(x, y, z));
                    machine.decors.push(decor);

                    let n = parseInt(dataString.substring(pt, pt += 2), 36);
                    decor.setN(n);

                    if (data.v === 8) {
                        let f = parseInt(dataString.substring(pt, pt += 1), 36) === 1 ? true : false;
                        decor.setFlip(f);
                    }
                }
            }

            if (data.r) {
                machine._roomIndex = data.r;
            }
            else {
                if (partCount % 2 === 0) {
                    machine._roomIndex = 0;
                }
                else if(partCount % 2 === 1) {
                    machine._roomIndex = 9;
                }
                else {
                    machine._roomIndex = 0;
                }
            }

            if (makeMiniature) {
                DrawMiniature(data, lines, canvas);
            }
        }
    }
}