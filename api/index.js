import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { DiscordRequest, VerifyDiscordRequest, getVehicleFromPlate } from './utils.js';

// Create an express app
const app = express();

// Get port, or default to 3000
const PORT = process.env.PORT || 3000;

// Has all the current action requests
var requests = [];

// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function (req, res) {

  // Interaction type and data
  const { type, data, member } = req.body;

  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    
    if (name === 'call') {

      // Validates the plate
      const plate = data
        .options[0]
        .value
        .trim()
        .toUpperCase()
        .replace(/-/g, '');

      // ID from the request
      const requestId = plate;

      // ID from the user who is requesting the action
      const requesterUserId = member.user.id;

      // Name from the user who is requesting the action
      const requesterUserName = member.user.username;

      // Adds the request to the storage
      requests[requestId] = {
        requesterUserId: requesterUserId
      };

      // Gets the vehicle data from de DB by its plates
      const vehicle = getVehicleFromPlate(plate);

      // Sets the message that will be shown if the plate is not in the DB
      var message = `Atenção @everyone, **${requesterUserName}** solicita que o veículo com a placa **${plate}** seja verificado no estacionamento.`;

      // If the plate is indeed in the DB
      if (vehicle) {

        // ID from the user who is the owner of the car
        requests[requestId].requestedUserId = vehicle.userId;

        // Changes the message
        message = `Atenção <@${vehicle.userId}>, **${requesterUserName}** solicita que você verifique **${vehicle.brand} ${vehicle.model} ${vehicle.color}** no estacionamento.`;

      }

      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: message,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: `on_my_way_${plate}`,
                  label: 'A ajuda está a caminho!',
                  style: ButtonStyleTypes.SUCCESS,
                },
              ],
            },
          ],
        },
      });
    }
  }

  else if (type === InteractionType.MESSAGE_COMPONENT) {
    const componentId = data.custom_id;
    
    if (componentId.startsWith('on_my_way_')) {

      // ID from the request
      const requestId = componentId.replace('on_my_way_', ''); 

      // ID from the user who is requesting the action
      const requesterUserId = requests[requestId].requesterUserId;

      // ID from the user who is responding to the request, whether he owns the car or not
      const responderUserName = req.body.member.user.username;

      // Delete message with token in request body
      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;

      try {

        await res.send({

          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,

          data: { 

            content: `<@${requesterUserId}>, **${responderUserName}** disse que a ajuda está a caminho.`,

            // flags: InteractionResponseFlags.EPHEMERAL,
            
          }

        });

        await DiscordRequest(endpoint, { method: 'DELETE' });

      } catch (err) {
        console.error('Error sending message:', err);
      }

    }
  }

});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
