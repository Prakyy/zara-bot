'use strict'

// resolve deps
const Telegram = require('telegram-node-bot')
const fetch = require('node-fetch');
const fs = require('fs')
const https = require('https')
const { exec } = require('child_process');

// env
const botAPIKey = ''
const ownerChatID = 
const keystorePASS = ''
const keystoreFileName = ''

const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
const tg = new Telegram.Telegram(botAPIKey)

class Greeting extends TelegramBaseController {
    pingHandler($) {
		const messageText = $.message.text;
        // Check if the message text qualifies as a standard greeting
        if ((/^(hi|hello|hey|hiya|sup|start|bonjour|hola)$/i).test(messageText)) {
            $.sendMessage('Namaste');
        }
		else {
			$.sendMessage('Quit messing around 🥱');
		}
	}
	get routes() {
        return {
            'pingCommand': 'pingHandler'
        }
    }
}

class DocumentController extends TelegramBaseController {
	handle($) {
		// Check if the message is a document
		if ($.message.document) {
			$.sendMessage('Working on it...')
			// Get the file name
			const fileName = $.message.document.fileName;
			// Check if the file has the .apk extension
			if (fileName.endsWith('.apk')) {
				// Get the file ID
				const fileId = $.message.document.fileId;
				// Get the file path and download URL
				tg.api.getFile(fileId).then(file => {
					// Fetch the file information
					const fetchUrl = `https://api.telegram.org/bot${botAPIKey}/getFile?file_id=${fileId}`;
					fetch(fetchUrl)
						.then(responseFetch => {
							if (!responseFetch.ok) {
								throw new Error('Failed to fetch file information');
							}
							return responseFetch.json();
						})
						.then(fileData => {
							if (fileData.ok && fileData.result && fileData.result.file_path) {
								const filePath = fileData.result.file_path;
								const downloadUrl = `https://api.telegram.org/file/bot${botAPIKey}/${filePath}`;
								exec(`wget ${downloadUrl} -O ./temp/${filePath} -q && apksigner sign --ks keystore/${keystoreFileName} --ks-pass pass:${keystorePASS} temp/${filePath}`, (error, stdout, stderr) => {
									if (error) {
											$.sendMessage(`Couldn\'t accept the file, sorry.`);
											console.error(`Error running bash command: ${error}`);
											return;
									}
									console.log(`stdout: ${stdout}`);
									console.error(`stderr: ${stderr}`);
									// Send the signed file back
									$.sendMessage(`Almost done, boo 😘`);
									tg.api.sendDocument($.message.chat.id, fs.createReadStream(`temp/${filePath}`))
										.then(() => {
											// Cleanup: Delete the temporary file
											fs.unlinkSync(`temp/${filePath}`);
										})
										.catch(error => {
											$.sendMessage(`Couldn\'t send the file, sorry.`)
											console.error('Error sending document:', error);
										});
								});
							}
						});
				});
			}
		}
	}
}

tg.onMaster(() => {
	tg.api.sendMessage(ownerChatID, "Ok, I'm up 🥱").catch(error => {
		console.error(error);
	});
});

tg.router
	.when(
		new TextCommand('', 'pingCommand'),
		new Greeting()
	)

	.otherwise(new DocumentController());
