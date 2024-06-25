export default function handler(req, res) {
    if (req.method === 'GET') {

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Encoding', 'gzip');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Your data here
    const data = {
        "title": "Blink Vote Test",
        "icon": "https://letscook.wtf/images/thumbs-up.svg",
        "description": "Vote on Something at letscook.wtf!",
        "label": "Vote",
        "links": {
            "actions": [
            {
                "label": "Vote Yes", // button text
                "href": "/api/proposal/1234/vote?choice=yes"
            },
            {
                "label": "Vote No", // button text
                "href": "/api/proposal/1234/vote?choice=no"
            },
            {
                "label": "Abstain from Vote", // button text
                "href": "/api/proposal/1234/vote?choice=abstain"
            }
            ]
        }
    }
    res.status(200).json(data);
    } else {
      // Handle any other HTTP method
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  }