// resolve deps
const { Telegraf } = require('telegraf');
const fs = require('fs');
const { exec } = require('child_process');

// env
const botToken = ;
const ownerChatID = ;
const keystorePASS = ;
const keystoreFileName = ;

const bot = new Telegraf(botToken);

// Command to trigger the inline options
bot.command('start', (ctx) => {
    ctx.reply('Choose an option:', {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: 'Option 1', callback_data: 'option1' },
                    { text: 'Option 2', callback_data: 'option2' },
                ],
                [
                    { text: 'Option 3', callback_data: 'option3' },
                    { text: 'Option 4', callback_data: 'option4' },
                ],
            ]
        }
    });
});

// Handle inline option callbacks
bot.action('option1', (ctx) => {
    ctx.reply('You chose Option 1');
});

bot.action('option2', (ctx) => {
    ctx.answerCbQuery('You chose Option 2');
});

bot.action('option3', (ctx) => {
    ctx.answerCbQuery('You chose Option 3');
});

bot.action('option4', (ctx) => {
    ctx.answerCbQuery('You chose Option 4');
});

bot.on('text', (ctx) => {
    //const messageText = ctx.message.text.toLowerCase();

    if (messageText.match(/^(hi|hello|hey|hiya|sup|start|bonjour|hola)$/i)) {
        ctx.reply('Namaste');
    } else {
        ctx.reply(`Quit messing around, ${ctx.message.from.first_name} 🥱`);
    }
});

// Handle Document
bot.on('document', async (ctx) => {
    const fileId = ctx.message.document.file_id;
    const fileName = ctx.message.document.file_name;

    if (fileName.endsWith('.apk')) {
        await ctx.reply('Working on it...');

        const fileLink = await ctx.telegram.getFileLink(fileId);
	//const fsFilePath=`./temp/${filePath}`;
	const filePath = `./temp/${fileName.replace('.apk', '_signed.apk')}`;
	console.log(`${fileLink}`);console.log(`${filePath}`);
        exec(`wget ${fileLink} -O "${filePath}" -q && apksigner sign --ks keystore/${keystoreFileName} --ks-pass pass:${keystorePASS} "${filePath}" && rm "${filePath}.idsig"`, async (error, stdout, stderr) => {
            if (error) {
                await ctx.reply('Couldn\'t handle the file');
                console.error(`Error running bash command: ${error}`);
                return;
            }

            // Send the signed file back
            await ctx.reply('It\'s on the way boo 😘', { reply_to_message_id: ctx.message.message_id });
            await ctx.replyWithDocument({ source: filePath });

            // Cleanup: Delete the temporary file
            fs.unlink(filePath, (err) => {
		    if (err) {
       			console.error(`Error deleting file: ${err}`);
    		    } else {
        		console.log(`File ${filePath} deleted successfully`);
    	    }
});

        });
    }
});

// Notify when bot is up
bot.telegram.sendMessage(ownerChatID, "Ok, I'm up 🥱").catch(error => {
    console.error(error);
});

bot.launch().then(() => {
    console.log('Bot started');
});
