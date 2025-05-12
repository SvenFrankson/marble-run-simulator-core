namespace MarbleRunSimulatorCore {
    export class UTurnSharp extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            if (isNaN(prop.h)) {
                prop.h = 1;
            }

            this.setTemplate(this.machine.templateManager.getTemplate(UTurnSharp.PropToPartName(prop)));

            for (let i = this.colors.length; i < 2; i++) {
                this.colors[i] = 0;
            }

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            let partName = "uturnsharp_" + prop.h.toFixed(0);
            return partName;
        }

        public static GenerateTemplate(h: number): MachinePartTemplate {
            let template = new MachinePartTemplate();

            if (isNaN(h)) {
                h = 1;
            }
            template.partName = "uturnsharp_" + h.toFixed(0);
            template.h = h;
            template.minH = 1;

            template.hExtendableOnY = true;
            template.xMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let dY = 0.014;
            let yTop = tileHeight * template.h;
            let yBottom = 0;

            let cY = (yTop + yBottom + dY) * 0.5;
            let rTop = Math.abs(yTop - cY);
            let rBottom = Math.abs(yBottom - cY);

            let aMaxTop = Math.PI * 0.5 + 0.02 / (rTop);
            aMaxTop = Nabu.MinMax(aMaxTop, 0, Math.PI);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(- tileWidth * 0.5, yBottom, 0), Tools.V3Dir(90), Tools.V3Dir(0))
            ];
            template.trackTemplates[0].colorIndex = 1;
            template.trackTemplates[0].drawEndTip = true;

            for (let a = 4; a > 0; a--) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);

                let dir = Tools.V3Dir(angle / Math.PI * 180 - 90);
                let norm = Tools.V3Dir(- angle / Math.PI * 180);

                let p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                p.x += sina * rBottom;
                p.y += cosa * rBottom;
                template.trackTemplates[0].trackpoints.push(new TrackPoint(template.trackTemplates[0], p, dir, norm));
            }

            template.trackTemplates[0].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[0],
                    new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY + rBottom, 0),
                    Tools.V3Dir(-90),
                    Tools.V3Dir(-180)
                )
            );

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 0;
            template.trackTemplates[1].trackpoints = [new TrackPoint(template.trackTemplates[1], new BABYLON.Vector3(- tileWidth * 0.5, yTop, 0), Tools.V3Dir(90), Tools.V3Dir(0))];
            template.trackTemplates[1].drawEndTip = true;
            template.trackTemplates[1].noMiniatureRender = true;

            for (let a = 0; a <= 4; a++) {
                let f = a / 4;
                let angle = Math.PI * f;
                let cosa = Math.cos(angle);
                let sina = Math.sin(angle);

                let dir = Tools.V3Dir(angle / Math.PI * 180 + 90);
                let norm = Tools.V3Dir(angle / Math.PI * 180);

                if (angle < aMaxTop) {
                    let p = new BABYLON.Vector3(- tileWidth * 0.5 + dY, cY, 0);
                    p.x += sina * rTop;
                    p.y += cosa * rTop;
                    template.trackTemplates[1].trackpoints.push(new TrackPoint(template.trackTemplates[1], p, dir, norm));
                }
            }

            template.trackTemplates[1].trackpoints.push(
                new TrackPoint(
                    template.trackTemplates[1],
                    new BABYLON.Vector3(- tileWidth * 0.5 + dY + Math.sin(aMaxTop) * rTop, cY + Math.cos(aMaxTop) * rTop, 0),
                    Tools.V3Dir(aMaxTop / Math.PI * 180 + 90),
                    Tools.V3Dir(aMaxTop / Math.PI * 180)
                )
            );

            template.initialize();

            return template;
        }
    }
}
