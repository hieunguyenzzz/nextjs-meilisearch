const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const main = async _ => {
    let translatedName = await prisma.mobelaris_translation.findFirst({
        where: {
            target_language: {equals: "fr"}, text_hash: {equals: "floor"}
        }
    })

    console.log(translatedName.text_translated);
}

main();