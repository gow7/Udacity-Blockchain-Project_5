const StarNotary = artifacts.require('StarNotary')

contract('StarNotary', accounts => {

    const user1 = accounts[1]
    const user2 = accounts[2]
    const randomMaliciousUser = accounts[3]

    const name = 'Star power 103!'
    const starStory = "I love my wonderful star"
    const ra = "ra_032.155"
    const dec = "dec_121.874"
    const mag = "mag_245.978"
    const starId = 1

    beforeEach(async function() { 
        this.contract = await StarNotary.new({from: user1})
    })

    describe('can create a star', () => { 
        it('can create a star and get its details', async function () { 
            await this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1});

            const starInfo = await this.contract.tokenIdToStarInfo(starId);
            assert.equal(starInfo[0], name);
            assert.equal(starInfo[1], starStory);
            assert.equal(starInfo[2], ra);
            assert.equal(starInfo[3], dec);
            assert.equal(starInfo[4], mag);
        })
    })

    describe('star uniqueness', () => { 
        it('only stars unique stars can be minted', async function() {
            await this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1});
            expectThrow(this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1}));
        })

        it('only stars unique stars can be minted even if their ID is different', async function() {
            await this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1});
            expectThrow(this.contract.createStar(name, starStory, ra, dec, mag, 2, {from: user1}));
        })

        it('minting unique stars does not fail', async function() { 
            for(let i = 0; i < 10; i ++) { 
                const id = i
                const newRa = i.toString()
                const newDec = i.toString()
                const newMag = i.toString()

                await this.contract.createStar(name, starStory, newRa, newDec, newMag, id, {from: user1})

                const starInfo = await this.contract.tokenIdToStarInfo(id);
                assert.equal(starInfo[0], name);
                assert.equal(starInfo[1], starStory);
                assert.equal(starInfo[2], newRa);
                assert.equal(starInfo[3], newDec);
                assert.equal(starInfo[4], newMag);
            }
        })
    })

    describe('buying and selling stars', () => { 

        const starPrice = web3.toWei(.01, "ether")

        beforeEach(async function () { 
            await this.contract.createStar(name, starStory, ra, dec, mag, starId, {from: user1})
        })

        it('user1 can put up their star for sale', async function () {
            await this.contract.putStarUpForSale(starId, starPrice, {from: user1});
            const salePrice = await this.contract.starsForSale(starId);

            assert.equal(starPrice, salePrice);
        })

        describe('user2 can buy a star that was put up for sale', () => { 
            beforeEach(async function () { 
                await this.contract.putStarUpForSale(starId, starPrice, {from: user1});
            })

            it('user2 is the owner of the star after they buy it', async function() {
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0});
                const currentOwner = await this.contract.ownerOf(starId);

                assert.equal(user2, currentOwner);
            })

            it('user2 ether balance changed correctly', async function () {
                const balanceBeforeTxn = web3.eth.getBalance(user2)
                await this.contract.buyStar(starId, {from: user2, value: starPrice, gasPrice: 0});
                const balanceAfterTxn = web3.eth.getBalance(user2)

                assert.equal(starPrice, balanceBeforeTxn - balanceAfterTxn);
            })
        })
    })
})

var expectThrow = async function(promise) { 
    try { 
        await promise
    } catch (error) { 
        assert.exists(error)
        return 
    }

    assert.fail('expected an error, but none was found')
}