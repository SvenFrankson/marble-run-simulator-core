namespace MarbleRunSimulatorCore {
    
    export class Curb extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(1);

            this.setTemplate(this.machine.templateManager.getTemplate(Curb.PropToPartName(prop)));
            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = (prop.pipeVersion ? "pipe" : "") + (prop.woodVersion ? "wood" : "") + "curb_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
            if (!prop.pipeVersion && !prop.woodVersion) {
                partName += "." + prop.s.toFixed(0);
            }
            return partName;
        }

        public static GenerateTemplate(l: number, h: number, s?: number, pipeVersion?: boolean, woodVersion?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = (pipeVersion ? "pipe" : "") + (woodVersion ? "wood" : "") + "curb_" + l.toFixed(0) + "." + h.toFixed(0);
            if (!pipeVersion && !woodVersion) {
                template.partName += "." + s.toFixed(0);
            }

            template.l = l;
            template.h = h;
            template.s = s;
            template.lExtendableOnXZ = true;
            template.hExtendableOnY = true;
            template.sExtendable = true;
            template.minH = -32;
            template.maxH = 32;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].isPipe = pipeVersion;
            template.trackTemplates[0].isWood = woodVersion;

            let cx = - 0.5 * tileSize;
            let cy = tileSize * template.l - 0.5 * tileSize;
            let r = tileSize * template.l - 0.5 * tileSize

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
