'use strict'

const Telegram = require('telegram-node-bot')
const fetch = require('node-fetch');
const fs = require('fs')
const https = require('https')

const botAPIKey = ''
const ownerChatID = 

const TelegramBaseController = Telegram.TelegramBaseController
const TextCommand = Telegram.TextCommand
const tg = new Telegram.Telegram(botAPIKey)

class Greeting extends TelegramBaseController {
    /**
     * @param {Scope} $
     */
    pingHandler($) {
		const messageText = $.message.text;
        // Check if the message text qualifies as a greeting
        if ((/^(hi|hello|hey|hiya|sup|start|bonjour|hola)$/i).test(messageText)) {
            $.sendMessage('Namaste');
        }
		else {
			$.sendMessage('Sorry, I don\'t understand 😕');
		}
	}

	get routes() {
        return {
            'pingCommand': 'pingHandler'
        }
    }
}


class DocumentController extends TelegramBaseController {
	/**
	 * @param {Scope} $
	 */
	handle($) {
		// Check if the message is a document
		if ($.message.document) {
			$.sendMessage('Working on it... 😪 ')
			// Get the file name
			const fileName = $.message.document.fileName;
			// Check if the file has the .apk extension
			if (fileName.endsWith('.apk')) {
				// Get the file ID
				const fileId = $.message.document.fileId;
				// Declare new file name
				const newFileName = 'signed_' + fileName;
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
								// Download the file
								https.get(downloadUrl, response => {
									const fileStream = fs.createWriteStream(newFileName);
									response.on('data', chunk => {
										fileStream.write(chunk);
									});

									response.on('end', () => {
										fileStream.end(() => {
											// Send the file back with the new name
											tg.api.sendDocument($.message.chat.id, fs.createReadStream(newFileName))
												.then(() => {
													// Cleanup: Delete the temporary file
													fs.unlinkSync(newFileName);
												})
												.catch(error => {
													console.error('Error sending document:', error);
												});
										});
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

	.otherwise(new DocumentController())