namespace MarbleRunSimulatorCore {
    export class UTurn extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);

            let partName = "uturn-" + prop.h.toFixed(0) + "." + prop.d.toFixed(0);
            this.setTemplate(this.machine.templateManager.getTemplate(partName, prop.mirrorX, prop.mirrorZ));
            this.generateWires();
        }

        public static GenerateTemplate(h: number, d: number, mirrorX?: boolean, mirrorZ?: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();
            template.getWidthForDepth = (argD) => {
                if (argD >= 8) {
                    return argD - 2;
                }
                return argD - 1;
            }

            template.partName = "uturn-" + h.toFixed(0) + "." + d.toFixed(0);
            template.angleSmoothSteps = 50;

            template.w = template.getWidthForDepth(d);
            template.h = h; 
            template.d = d; 
            template.mirrorX = mirrorX; 
            template.mirrorZ = mirrorZ;

            template.yExtendable = true;
            template.zExtendable = true;
            template.minD = 2;
            template.xMirrorable = true;
            template.zMirrorable = true;

            let dir = new BABYLON.Vector3(1, 0, 0);
            dir.normalize();
            let n = new BABYLON.Vector3(0, 1, 0);
            n.normalize();

            let r = tileDepth * (d - 1) * 0.5;
            let x0 = -tileWidth * 0.5 + (2 * Math.PI * r) / 6;
            let r2 = r / Math.SQRT2;
            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, 0), new BABYLON.Vector3(1, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, 0)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r + r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r, 0, -r)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + r2, 0, -r - r2)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0 + 0, 0, -2 * r)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(-tileWidth * 0.5, 0, -2 * r), new BABYLON.Vector3(-1, 0, 0)),
            ];

            for (let n = 0; n < template.trackTemplates[0].trackpoints.length; n++) {
                let f = n / (template.trackTemplates[0].trackpoints.length - 1);
                template.trackTemplates[0].trackpoints[n].position.y = -f * template.h * tileHeight;
            }

            if (mirrorX) {
                template.mirrorXTrackPointsInPlace();
            }
            if (mirrorZ) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
