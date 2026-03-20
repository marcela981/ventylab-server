const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const activeReservation = await prisma.ventilatorReservation.findFirst({
        where: { status: 'ACTIVE' },
    });
    console.log("Active reservation:", activeReservation);
    if (activeReservation) {
        console.log("endTime.getTime():", activeReservation.endTime.getTime());
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
