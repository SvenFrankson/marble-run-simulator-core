/// <reference path="../machine/MachinePart.ts"/>

namespace MarbleRunSimulatorCore {
    export class Coil extends MachinePart {
        constructor(machine: Machine, prop: IMachinePartProp) {
            super(machine, prop);
            this.setColorCount(2);

            this.setTemplate(this.machine.templateManager.getTemplate(Coil.PropToPartName(prop), prop.mirrorX));

            let coilWire = new Wire(this);
            coilWire.doubleContactPoints = true;
            coilWire.colorIndex = 0;
            coilWire.path = [];

            let x0 = - tileSize * 0.5;
            let x1 = tileSize * (this.l - 0.5);

            let z0 = - Math.floor((this.l - 1) * 0.5) * tileSize;
            let z1 = this.wireGauge * 0.3;
            let distZ = z1 - (z0 + this.wireGauge * 0.7);
            let r0 = z1 - z0;
            let h = (this.h - 1) * tileHeight;
            
            let tanB = h / distZ;
            let bank = Math.atan(tanB);
            let cosB = Math.cos(bank);
            let sinB = Math.sin(bank);
            let length = Math.sqrt(distZ * distZ + h * h);
            let count = Math.floor(length / this.wireGauge);
            let zSign = prop.mirrorX ? - 1 : 1;

            for (let n = 0; n <= count + 2; n++) {
                for (let i = 0; i < 64; i++) {
                    let r = r0 - (n + i / 64) * this.wireGauge * cosB;
                    let clampedR = Math.max(0.7 * this.wireGauge, r);
                    let a = i / 64 * 2 * Math.PI;
                    let z = Math.cos(a) * clampedR;
                    let x = Math.sin(a) * clampedR;

                    let y = - (n + i / 64) * this.wireGauge * sinB;
                    let drop = Math.abs(r - clampedR);
                    drop = Math.min(drop, tileHeight * 0.3);
                    y = Math.max(y, - h) - drop;
                    coilWire.path.push(new BABYLON.Vector3(
                        0.5 * (x0 + x1) + x,
                        y,
                        zSign * (z0 + z)
                    ));
                }
            }
            this.wires.push(coilWire);

            this.generateWires();
        }

        public static PropToPartName(prop: IMachinePartProp): string {
            return "coil_" + prop.l.toFixed(0) + "." + prop.h.toFixed(0);
        }

        public static GenerateTemplate(l: number, h: number, mirror: boolean): MachinePartTemplate {
            let template = new MachinePartTemplate();

            template.partName = "coil_" + l.toFixed(0) + "." + h.toFixed(0);

            template.l = l;
            template.h = h;
            template.n = h;

            template.lExtendableOnX = true;
            template.minL = 4;
            template.maxL = 12;
            template.hExtendableOnY = true;
            template.minH = 1;
            template.maxH = 12;
            template.downwardYExtendable = true;
            template.mirror = mirror;
            template.mirrorable = true;

            template.maxAngle = 0;

            let x0 = - tileSize * 0.5;
            let x1 = tileSize * (template.l - 0.5);
            if (template.l < 0) {
                x0 = tileSize * (Math.abs(template.l) - 0.5);
                x1 = - tileSize * 0.5;
            }
            let c = (x0 + x1) * 0.5;

            let z0 = - Math.floor((template.l - 1) * 0.5) * tileSize;
            let z1 = 0.014 * 0.3;
            let distZ = z1 - (z0 + 0.014 * 0.7);
            let r0 = z1 - z0;
            let coilH = (template.h - 1) * tileHeight;
            
            let tanB = coilH / distZ;
            let bank = Math.atan(tanB);
            template.defaultAngle = - bank;
            let cosB = Math.cos(bank);
            let sinB = Math.sin(bank);

            let n = new BABYLON.Vector3(0, cosB, - sinB);

            template.trackTemplates[0] = new TrackTemplate(template);
            template.trackTemplates[0].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x0, 0, 0), Tools.V3Dir(template.l > 0 ? 90 : -90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3((x0 + x1) * 0.5, - 0.007 * sinB, 0.007 * (1 - cosB) + z1 - 0.014 * 0.5), Tools.V3Dir(template.l > 0 ? 90 : -90), n)
            ];

            template.trackTemplates[1] = new TrackTemplate(template);
            template.trackTemplates[1].colorIndex = 1;
            template.trackTemplates[1].trackpoints = [
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(c - tileSize, - tileHeight * (template.h + 0) + 0.01, z0), Tools.V3Dir(125), undefined, undefined, 0.7),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(c + tileSize, - tileHeight * (template.h + 0), z0), Tools.V3Dir(90)),
                new TrackPoint(template.trackTemplates[0], new BABYLON.Vector3(x1, - tileHeight * (template.h + 0), z0), Tools.V3Dir(90))
            ];
            template.trackTemplates[1].drawStartTip = true;

            if (template.mirror) {
                template.mirrorZTrackPointsInPlace();
            }

            template.initialize();

            return template;
        }
    }
}
