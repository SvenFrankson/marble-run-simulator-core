namespace MarbleRunSimulatorCore {
    export class MachineCollider {

        public bouncyness: number = 0.5;
        public randomness: number = 0;

        public onImpact = (hit: Mummu.IIntersection) => {};

        constructor(public baseCollider: Mummu.Collider) {

        }

        public getSurface: () => Surface = () => {
            return Surface.Rail;
        }
    }
}