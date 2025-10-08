const { Webhook } = require('svix');
const User = require('../models/User');

const handleClerkWebhook = async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET is not set.');
    return res.status(500).send('Server configuration error.');
  }

  const headers = req.headers;
  const payload = req.body;
  const svix_id = headers['svix-id'];
  const svix_timestamp = headers['svix-timestamp'];
  const svix_signature = headers['svix-signature'];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).send('Error occurred -- no svix headers');
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt;

  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).send('Error occurred');
  }

  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with an ID of ${id} and type of ${eventType}`);

  try {
    switch (eventType) {
      case 'user.created': {
        const { id: clerkUserId, email_addresses, first_name, last_name, image_url } = evt.data;
        const primaryEmail = email_addresses.find(e => e.id === evt.data.primary_email_address_id)?.email_address;

        if (!primaryEmail) {
          console.error('No primary email address found for user.created event.');
          return res.status(400).send('Primary email address is required.');
        }

        const newUser = new User({
          clerkUserId,
          email: primaryEmail,
          name: `${first_name || ''} ${last_name || ''}`.trim(),
          fullName: `${first_name || ''} ${last_name || ''}`.trim(),
          profile: {
            avatar: image_url,
          },
        });
        await newUser.save();
        console.log(`User ${clerkUserId} was created in the database.`);
        break;
      }
      case 'user.updated': {
        const { id: clerkUserId, first_name, last_name, image_url } = evt.data;
        const user = await User.findOne({ clerkUserId });

        if (user) {
          user.name = `${first_name || ''} ${last_name || ''}`.trim();
          user.fullName = `${first_name || ''} ${last_name || ''}`.trim();
          user.profile.avatar = image_url;
          await user.save();
          console.log(`User ${clerkUserId} was updated in the database.`);
        }
        break;
      }
      case 'user.deleted': {
        const { id: clerkUserId } = evt.data;
        await User.findOneAndDelete({ clerkUserId });
        console.log(`User ${clerkUserId} was deleted from the database.`);
        break;
      }
    }
    res.status(200).send('Webhook processed successfully.');
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).send('Internal Server Error');
  }
};

module.exports = { handleClerkWebhook };
