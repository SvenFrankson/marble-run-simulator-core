namespace MarbleRunSimulatorCore {
    export class Wall extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (this.machine.version < 11) {
                this.magnetic = true;
            }

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
            template.maxAngle = Math.PI / 6;
            template.defaultAngle = 0;

            template.l = l;
            template.minL = 3;
            template.h = h;
            template.minH = 3;

            template.yExtendable = true;
            template.lExtendableOnZ = true;

            let height = tileHeight * template.h;
            let depth = tileSize * template.l;

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].forcedAngle = 0;

            let N = 6;
            for (let n = 0; n < N; n++) {
                let f = n / N;
                f = f * f;

                let a = - Math.PI * 0.5 + f * Math.PI * 0.5;
                let y = Math.cos(a) * height;
                let x = height * Math.sqrt(1 - (y / height - 1) * (y / height - 1));
                let z = Math.sin(a) * depth * 0.5;

                x -= tileSize * 0.5;
                z += depth * 0.5;

                let dir: BABYLON.Vector3;
                if (n === 0) {
                    dir = new BABYLON.Vector3(1, 0, 0);
                }

                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, y, z), dir));
            }
            for (let n = 0; n <= N; n++) {
                let f = n / N;
                f = 1 - f;
                f = f * f;
                f = 1 - f;

                let a = f * Math.PI * 0.5;
                let y = Math.cos(a) * height;
                let x = height * Math.sqrt(1 - (y / height - 1) * (y / height - 1));
                let z = Math.sin(a) * depth * 0.5;

                x -= tileSize * 0.5;
                z += depth * 0.5;

                let dir: BABYLON.Vector3;
                if (n === N) {
                    dir = new BABYLON.Vector3(- 1, 0, 0);
                }

                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x, y, z), dir));
            }

            let c = new BABYLON.Vector3(- tileSize * 0.5, tileHeight * template.h * 0.25, tileSize * template.l * 0.5);
            template.trackTemplates[0].onNormalEvaluated = (n, p, i) => {
                let f = Math.abs(2 * (i - 0.5));
                f = f * f;
                let aim = c.subtract(p).normalize();
                let up = BABYLON.Vector3.Up();
                BABYLON.Vector3.SlerpToRef(up, aim, 1 - f, n);
                n.normalize();
            }
            template.initialize();

            return template;
        }
    }
}
