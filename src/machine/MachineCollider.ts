namespace MarbleRunSimulatorCore {
    export class MachineCollider {

        constructor(public baseCollider: Mummu.Collider) {

        }

        public getSurface: () => Surface = () => {
            return Surface.Rail;
        }
    }
}