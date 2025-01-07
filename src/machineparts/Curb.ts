namespace MarbleRunSimulatorCore {
    
    export class Curb extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "curb-" + prop.w.toFixed(0) + "." + prop.h.toFixed(0) + "." + prop.s.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName));
            this.generateWires();
        }

        public static GenerateTemplate(l: number, h: number, s: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "curb-" + l.toFixed(0) + "." + h.toFixed(0) + "." + s.toFixed(0);

            template.w = l;
            template.h = h;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;

            let cx = - 0.5 * tileSize;
            let cy = tileSize * template.w - 0.5 * tileSize;
            let r = tileSize * template.w - 0.5 * tileSize

            template.trackTemplates[0].trackpoints = [
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(cx + Math.sin(0) * r, 0, cy - Math.cos(0) * r),
                    new BABYLON.Vector3(1, 0, 0)
                )
            ];

            for (let n = 1; n < 4; n++) {
                let h = Nabu.Easing.easeInOutSine(n / 4) * tileHeight * template.h;
                template.trackTemplates[0].trackpoints.push(
                    new TrackPoint(
                        template.trackTemplates[0],
                        new BABYLON.Vector3(cx + Math.sin(n / 4 * 0.5 * Math.PI) * r, h, cy - Math.cos(n / 4 * 0.5 * Math.PI) * r)
                    )
                );
            }

            template.trackTemplates[0].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(cx + Math.sin(Math.PI * 0.5) * r, tileHeight * template.h, cy - Math.cos(Math.PI * 0.5) * r),
                    new BABYLON.Vector3(0, 0, 1)
                )
            );

            template.maxAngle = Math.PI / 4 / 2 * template.s;

            template.initialize();

            return template;
        }
    }
}
