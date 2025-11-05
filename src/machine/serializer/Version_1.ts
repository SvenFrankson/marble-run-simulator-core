namespace MarbleRunSimulatorCore {
    
    export function SerializeV1(machine: Machine): IMachineData {
        
        let data: IMachineData = {
            name: machine.name,
            author: machine.author,
            balls: [],
            parts: [],
        };

        for (let i = 0; i < machine.balls.length; i++) {
            data.balls.push({
                x: machine.balls[i].positionZero.x,
                y: machine.balls[i].positionZero.y,
                z: machine.balls[i].positionZero.z,
            });
        }

        for (let i = 0; i < machine.parts.length; i++) {
            data.parts.push({
                name: machine.parts[i].partName,
                i: machine.parts[i].i,
                j: machine.parts[i].j,
                k: machine.parts[i].k,
                mirrorX: machine.parts[i].mirrorX,
                mirrorZ: machine.parts[i].mirrorZ,
                c: machine.parts[i].colors,
            });
        }

        return data;
    }

    export function DeserializeV1(machine: Machine, data: IMachineData): void {
        if (data.name) {
            machine.name = data.name;
        }
        if (data.author) {
            machine.author = data.author;
        }
        machine.constructionMode = MachineConstructionMode.Mode3D;
        
        machine.balls = [];
        machine.parts = [];

        for (let i = 0; i < data.balls.length; i++) {
            let ballData = data.balls[i];
            let ball = new Ball(new BABYLON.Vector3(ballData.x, ballData.y, isFinite(ballData.z) ? ballData.z : 0), machine);
            machine.balls.push(ball);
        }

        for (let i = 0; i < data.parts.length; i++) {
            let part = data.parts[i];
            let prop: IMachinePartProp = {
                i: part.i * 2,
                j: part.j,
                k: part.k,
                mirrorX: part.mirrorX,
                mirrorZ: part.mirrorZ,
            };
            if (typeof part.c === "number") {
                prop.c = [part.c];
            } else if (part.c) {
                prop.c = part.c;
            }
            let track = machine.trackFactory.createTrack(part.name, prop);
            if (track) {
                if (data.sleepers) {
                    track.sleepersMeshProp = data.sleepers;
                }
                machine.parts.push(track);
            }
        }
    }
}