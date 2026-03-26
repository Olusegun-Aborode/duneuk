#!/bin/bash
# Download missing EUR stablecoin logos from CoinGecko
# Run: bash download-logos.sh

DIR="/Users/olusegunaborode/Data Projects/duneuk-terminal/public/tokens"

echo "Downloading missing EUR stablecoin logos..."

curl -sL "https://coin-images.coingecko.com/coins/images/39952/small/EURI.jpg?1724902829" -o "$DIR/EURI.png"
echo "Downloaded EURI.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/33469/small/aeur-icon2.png?1701944612" -o "$DIR/AEUR.png"
echo "Downloaded AEUR.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/53720/small/stablreuro-logo.png?1737125898" -o "$DIR/EURR.png"
echo "Downloaded EURR.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/52132/small/europ-symbol-rgb.jpg?1732634862" -o "$DIR/EUROP.png"
echo "Downloaded EUROP.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/16756/small/EURm_%28Mento_Euro%29.png?1768982616" -o "$DIR/EURm.png"
echo "Downloaded EURm.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/29351/small/VNXEUR_%281%29.png?1696528300" -o "$DIR/VEUR.png"
echo "Downloaded VEUR.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/68076/small/EURAU_Full_Colour.png?1754717091" -o "$DIR/EURAU.png"
echo "Downloaded EURAU.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/17285/small/Iron_Bank_Euro.png?1696516839" -o "$DIR/IBEUR.png"
echo "Downloaded IBEUR.png"
sleep 1

curl -sL "https://coin-images.coingecko.com/coins/images/32421/small/eEUR.png?1733063519" -o "$DIR/eEUR.png"
echo "Downloaded eEUR.png"

echo ""
echo "All downloads complete! Verifying..."
for f in EURI AEUR EURR EUROP EURm VEUR EURAU IBEUR eEUR; do
  if [ -f "$DIR/$f.png" ]; then
    size=$(wc -c < "$DIR/$f.png")
    echo "  $f.png: $size bytes"
  else
    echo "  $f.png: MISSING"
  fi
done
