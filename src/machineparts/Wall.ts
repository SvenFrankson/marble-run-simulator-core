namespace MarbleRunSimulatorCore {
    export class Wall extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            this.setTemplate(this.machine.templateManager.getTemplate(Wall.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "wall_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(l: number, h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "wall_" + l.toFixed(0) + "." + h.toFixed(0);
            template.maxAngle = (0.8 * Math.PI) / 2;
            template.minTurnRadius = 0.12;

            template.l = l;
            template.minL = 3;
            template.h = h;
            template.minH = 3;

            template.yExtendable = true;
            template.lExtendableOnZ = true;

            let height = tileHeight * template.h;
            let depth = tileSize * template.l;

            template.trackTemplates[0] = new TrackTemplate(template);

            let N = 64;
            for (let n = 0; n <= N; n++) {
                let f = n / N;
                let a = - Math.PI * 0.5 + f * Math.PI;
                let y = Math.cos(a) * height;
                let x = height * Math.sqrt(1 - (y / height - 1) * (y / height - 1));
                let z = Math.sin(a) * depth * 0.5;

                x -= tileSize * 0.5;
                z += depth * 0.5;

                let dir: BABYLON.Vector3;
                let norm: BABYLON.Vector3;
                if (n === 0) {
                    dir = new BABYLON.Vector3(1, 0, 0);
                    norm = BABYLON.Vector3.Up();
                }
                else if (n === N / 2) {
                    dir = new BABYLON.Vector3(0, 0, 1);
                    norm = new BABYLON.Vector3(-1, 1, 0);
                }
                else if (n === N) {
                    dir = new BABYLON.Vector3(- 1, 0, 0);
                    norm = BABYLON.Vector3.Up();
                }

                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, y, z), dir, norm));
            }

            template.initialize();

            return template;
        }
    }
}
