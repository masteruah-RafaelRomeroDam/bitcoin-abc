import {
    shouldRejectAmountInput,
    fiatToCrypto,
    isValidTokenName,
    isValidTokenTicker,
    isValidTokenDecimals,
    isValidTokenInitialQty,
    isValidTokenDocumentUrl,
    isValidTokenStats,
    isValidCashtabSettings,
    isValidXecAddress,
    isValidEtokenAddress,
    isValidXecSendAmount,
    isValidSendToMany,
    isValidUtxo,
    isValidBchApiUtxoObject,
} from '../validation';
import { currency } from '@components/Common/Ticker.js';
import { fromSmallestDenomination } from '@utils/cashMethods';
import {
    stStatsValid,
    noCovidStatsValid,
    noCovidStatsInvalid,
    cGenStatsValid,
} from '../__mocks__/mockTokenStats';

import {
    validUtxo,
    invalidUtxoMissingHeight,
    invalidUtxoTxidUndefined,
    hydratedUtxoDetailsAfterRemovingConsumedUtxos,
    utxosAfterSentTxIncremental,
} from '../__mocks__/incrementalUtxoMocks';

describe('Validation utils', () => {
    it(`Returns 'false' if ${currency.ticker} send amount is a valid send amount`, () => {
        expect(shouldRejectAmountInput('10', currency.ticker, 20.0, 300)).toBe(
            false,
        );
    });
    it(`Returns 'false' if ${currency.ticker} send amount is a valid send amount in USD`, () => {
        // Here, user is trying to send $170 USD, where 1 BCHA = $20 USD, and the user has a balance of 15 BCHA or $300
        expect(shouldRejectAmountInput('170', 'USD', 20.0, 15)).toBe(false);
    });
    it(`Returns not a number if ${currency.ticker} send amount is not a number`, () => {
        const expectedValidationError = `Amount must be a number`;
        expect(
            shouldRejectAmountInput('Not a number', currency.ticker, 20.0, 3),
        ).toBe(expectedValidationError);
    });
    it(`Returns amount must be greater than 0 if ${currency.ticker} send amount is 0`, () => {
        const expectedValidationError = `Amount must be greater than 0`;
        expect(shouldRejectAmountInput('0', currency.ticker, 20.0, 3)).toBe(
            expectedValidationError,
        );
    });
    it(`Returns amount must be greater than 0 if ${currency.ticker} send amount is less than 0`, () => {
        const expectedValidationError = `Amount must be greater than 0`;
        expect(
            shouldRejectAmountInput('-0.031', currency.ticker, 20.0, 3),
        ).toBe(expectedValidationError);
    });
    it(`Returns balance error if ${currency.ticker} send amount is greater than user balance`, () => {
        const expectedValidationError = `Amount cannot exceed your ${currency.ticker} balance`;
        expect(shouldRejectAmountInput('17', currency.ticker, 20.0, 3)).toBe(
            expectedValidationError,
        );
    });
    it(`Returns balance error if ${currency.ticker} send amount is greater than user balance`, () => {
        const expectedValidationError = `Amount cannot exceed your ${currency.ticker} balance`;
        expect(shouldRejectAmountInput('17', currency.ticker, 20.0, 3)).toBe(
            expectedValidationError,
        );
    });
    it(`Returns error if ${
        currency.ticker
    } send amount is less than ${fromSmallestDenomination(
        currency.dustSats,
    ).toString()} minimum`, () => {
        const expectedValidationError = `Send amount must be at least ${fromSmallestDenomination(
            currency.dustSats,
        ).toString()} ${currency.ticker}`;
        expect(
            shouldRejectAmountInput(
                (
                    fromSmallestDenomination(currency.dustSats).toString() -
                    0.00000001
                ).toString(),
                currency.ticker,
                20.0,
                3,
            ),
        ).toBe(expectedValidationError);
    });
    it(`Returns error if ${
        currency.ticker
    } send amount is less than ${fromSmallestDenomination(
        currency.dustSats,
    ).toString()} minimum in fiat currency`, () => {
        const expectedValidationError = `Send amount must be at least ${fromSmallestDenomination(
            currency.dustSats,
        ).toString()} ${currency.ticker}`;
        expect(
            shouldRejectAmountInput('0.0000005', 'USD', 0.00005, 1000000),
        ).toBe(expectedValidationError);
    });
    it(`Returns balance error if ${currency.ticker} send amount is greater than user balance with fiat currency selected`, () => {
        const expectedValidationError = `Amount cannot exceed your ${currency.ticker} balance`;
        // Here, user is trying to send $170 USD, where 1 BCHA = $20 USD, and the user has a balance of 5 BCHA or $100
        expect(shouldRejectAmountInput('170', 'USD', 20.0, 5)).toBe(
            expectedValidationError,
        );
    });
    it(`Returns precision error if ${currency.ticker} send amount has more than ${currency.cashDecimals} decimal places`, () => {
        const expectedValidationError = `${currency.ticker} transactions do not support more than ${currency.cashDecimals} decimal places`;
        expect(
            shouldRejectAmountInput('17.123456789', currency.ticker, 20.0, 35),
        ).toBe(expectedValidationError);
    });
    it(`Returns expected crypto amount with ${currency.cashDecimals} decimals of precision even if inputs have higher precision`, () => {
        expect(fiatToCrypto('10.97231694823432', 20.3231342349234234, 8)).toBe(
            '0.53989295',
        );
    });
    it(`Returns expected crypto amount with ${currency.cashDecimals} decimals of precision even if inputs have higher precision`, () => {
        expect(fiatToCrypto('10.97231694823432', 20.3231342349234234, 2)).toBe(
            '0.54',
        );
    });
    it(`Returns expected crypto amount with ${currency.cashDecimals} decimals of precision even if inputs have lower precision`, () => {
        expect(fiatToCrypto('10.94', 10, 8)).toBe('1.09400000');
    });
    it(`Accepts a valid ${currency.tokenTicker} token name`, () => {
        expect(isValidTokenName('Valid token name')).toBe(true);
    });
    it(`Accepts a valid ${currency.tokenTicker} token name that is a stringified number`, () => {
        expect(isValidTokenName('123456789')).toBe(true);
    });
    it(`Rejects ${currency.tokenTicker} token name if longer than 68 characters`, () => {
        expect(
            isValidTokenName(
                'This token name is not valid because it is longer than 68 characters which is really pretty long for a token name when you think about it and all',
            ),
        ).toBe(false);
    });
    it(`Rejects ${currency.tokenTicker} token name if empty string`, () => {
        expect(isValidTokenName('')).toBe(false);
    });
    it(`Accepts a 4-char ${currency.tokenTicker} token ticker`, () => {
        expect(isValidTokenTicker('DOGE')).toBe(true);
    });
    it(`Accepts a 12-char ${currency.tokenTicker} token ticker`, () => {
        expect(isValidTokenTicker('123456789123')).toBe(true);
    });
    it(`Rejects ${currency.tokenTicker} token ticker if empty string`, () => {
        expect(isValidTokenTicker('')).toBe(false);
    });
    it(`Rejects ${currency.tokenTicker} token ticker if > 12 chars`, () => {
        expect(isValidTokenTicker('1234567891234')).toBe(false);
    });
    it(`Accepts ${currency.tokenDecimals} if zero`, () => {
        expect(isValidTokenDecimals('0')).toBe(true);
    });
    it(`Accepts ${currency.tokenDecimals} if between 0 and 9 inclusive`, () => {
        expect(isValidTokenDecimals('9')).toBe(true);
    });
    it(`Rejects ${currency.tokenDecimals} if empty string`, () => {
        expect(isValidTokenDecimals('')).toBe(false);
    });
    it(`Rejects ${currency.tokenDecimals} if non-integer`, () => {
        expect(isValidTokenDecimals('1.7')).toBe(false);
    });
    it(`Accepts ${currency.tokenDecimals} initial genesis quantity at minimum amount for 3 decimal places`, () => {
        expect(isValidTokenInitialQty('0.001', '3')).toBe(true);
    });
    it(`Accepts ${currency.tokenDecimals} initial genesis quantity at minimum amount for 9 decimal places`, () => {
        expect(isValidTokenInitialQty('0.000000001', '9')).toBe(true);
    });
    it(`Accepts ${currency.tokenDecimals} initial genesis quantity at amount below 100 billion`, () => {
        expect(isValidTokenInitialQty('1000', '0')).toBe(true);
    });
    it(`Accepts highest possible ${currency.tokenDecimals} initial genesis quantity at amount below 100 billion`, () => {
        expect(isValidTokenInitialQty('99999999999.999999999', '9')).toBe(true);
    });
    it(`Accepts ${currency.tokenDecimals} initial genesis quantity if decimal places equal tokenDecimals`, () => {
        expect(isValidTokenInitialQty('0.123', '3')).toBe(true);
    });
    it(`Accepts ${currency.tokenDecimals} initial genesis quantity if decimal places are less than tokenDecimals`, () => {
        expect(isValidTokenInitialQty('0.12345', '9')).toBe(true);
    });
    it(`Rejects ${currency.tokenDecimals} initial genesis quantity of zero`, () => {
        expect(isValidTokenInitialQty('0', '9')).toBe(false);
    });
    it(`Rejects ${currency.tokenDecimals} initial genesis quantity if tokenDecimals is not valid`, () => {
        expect(isValidTokenInitialQty('0', '')).toBe(false);
    });
    it(`Rejects ${currency.tokenDecimals} initial genesis quantity if 100 billion or higher`, () => {
        expect(isValidTokenInitialQty('100000000000', '0')).toBe(false);
    });
    it(`Rejects ${currency.tokenDecimals} initial genesis quantity if it has more decimal places than tokenDecimals`, () => {
        expect(isValidTokenInitialQty('1.5', '0')).toBe(false);
    });
    it(`Accepts a valid ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('cashtabapp.com')).toBe(true);
    });
    it(`Accepts a valid ${currency.tokenTicker} token document URL including special URL characters`, () => {
        expect(isValidTokenDocumentUrl('https://cashtabapp.com/')).toBe(true);
    });
    it(`Accepts a blank string as a valid ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('')).toBe(true);
    });
    it(`Rejects ${currency.tokenTicker} token name if longer than 68 characters`, () => {
        expect(
            isValidTokenDocumentUrl(
                'http://www.ThisTokenDocumentUrlIsActuallyMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchMuchTooLong.com/',
            ),
        ).toBe(false);
    });
    it(`Accepts a domain input with https protocol as ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('https://google.com')).toBe(true);
    });
    it(`Accepts a domain input with http protocol as ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('http://test.com')).toBe(true);
    });
    it(`Accepts a domain input with a primary and secondary top level domain as ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('http://test.co.uk')).toBe(true);
    });
    it(`Accepts a domain input with just a subdomain as ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('www.test.co.uk')).toBe(true);
    });
    it(`Rejects a domain input with no top level domain, protocol or subdomain  ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl('mywebsite')).toBe(false);
    });
    it(`Rejects a domain input as numbers ${currency.tokenTicker} token document URL`, () => {
        expect(isValidTokenDocumentUrl(12345)).toBe(false);
    });
    it(`Correctly validates token stats for token created before the ${currency.ticker} fork`, () => {
        expect(isValidTokenStats(stStatsValid)).toBe(true);
    });
    it(`Correctly validates token stats for token created after the ${currency.ticker} fork`, () => {
        expect(isValidTokenStats(noCovidStatsValid)).toBe(true);
    });
    it(`Correctly validates token stats for token with no minting baton`, () => {
        expect(isValidTokenStats(cGenStatsValid)).toBe(true);
    });
    it(`Recognizes a token stats object with missing required keys as invalid`, () => {
        expect(isValidTokenStats(noCovidStatsInvalid)).toBe(false);
    });
    it(`Recognizes a valid cashtab settings object`, () => {
        expect(isValidCashtabSettings({ fiatCurrency: 'usd' })).toBe(true);
    });
    it(`Rejects a cashtab settings object for an unsupported currency`, () => {
        expect(isValidCashtabSettings({ fiatCurrency: 'xau' })).toBe(false);
    });
    it(`Rejects a corrupted cashtab settings object for an unsupported currency`, () => {
        expect(isValidCashtabSettings({ fiatCurrencyWrongLabel: 'usd' })).toBe(
            false,
        );
    });
    it(`isValidXecAddress correctly validates a valid XEC address with ecash: prefix`, () => {
        const addr = 'ecash:qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035';
        expect(isValidXecAddress(addr)).toBe(true);
    });
    it(`isValidXecAddress correctly validates a valid XEC address without ecash: prefix`, () => {
        const addr = 'qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035';
        expect(isValidXecAddress(addr)).toBe(true);
    });
    it(`isValidXecAddress rejects a valid legacy address`, () => {
        const addr = '1Efd9z9GRVJK2r73nUpFmBnsKUmfXNm2y2';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a valid bitcoincash: address`, () => {
        const addr = 'bitcoincash:qz2708636snqhsxu8wnlka78h6fdp77ar5ulhz04hr';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a valid etoken: address with prefix`, () => {
        const addr = 'etoken:qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a valid etoken: address without prefix`, () => {
        const addr = 'qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a valid simpleledger: address with prefix`, () => {
        const addr = 'simpleledger:qrujw0wrzncyxw8q3d0xkfet4jafrqhk6csev0v6y3';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a valid simpleledger: address without prefix`, () => {
        const addr = 'qrujw0wrzncyxw8q3d0xkfet4jafrqhk6csev0v6y3';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects an invalid address`, () => {
        const addr = 'wtf is this definitely not an address';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects a null input`, () => {
        const addr = null;
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidXecAddress rejects an empty string input`, () => {
        const addr = '';
        expect(isValidXecAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a valid XEC address with ecash: prefix`, () => {
        const addr = 'ecash:qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a valid XEC address without ecash: prefix`, () => {
        const addr = 'qz2708636snqhsxu8wnlka78h6fdp77ar59jrf5035';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a valid legacy address`, () => {
        const addr = '1Efd9z9GRVJK2r73nUpFmBnsKUmfXNm2y2';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a valid bitcoincash: address`, () => {
        const addr = 'bitcoincash:qz2708636snqhsxu8wnlka78h6fdp77ar5ulhz04hr';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress correctly validates a valid etoken: address with prefix`, () => {
        const addr = 'etoken:qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r';
        expect(isValidEtokenAddress(addr)).toBe(true);
    });
    it(`isValidEtokenAddress correctly validates a valid etoken: address without prefix`, () => {
        const addr = 'qz2708636snqhsxu8wnlka78h6fdp77ar5tv2tzg4r';
        expect(isValidEtokenAddress(addr)).toBe(true);
    });
    it(`isValidEtokenAddress rejects a valid simpleledger: address with prefix`, () => {
        const addr = 'simpleledger:qrujw0wrzncyxw8q3d0xkfet4jafrqhk6csev0v6y3';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a valid simpleledger: address without prefix`, () => {
        const addr = 'qrujw0wrzncyxw8q3d0xkfet4jafrqhk6csev0v6y3';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects an invalid address`, () => {
        const addr = 'wtf is this definitely not an address';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects a null input`, () => {
        const addr = null;
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidEtokenAddress rejects an empty string input`, () => {
        const addr = '';
        expect(isValidEtokenAddress(addr)).toBe(false);
    });
    it(`isValidXecSendAmount accepts the dust minimum`, () => {
        const testXecSendAmount = fromSmallestDenomination(currency.dustSats);
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(true);
    });
    it(`isValidXecSendAmount accepts arbitrary number above dust minimum`, () => {
        const testXecSendAmount =
            fromSmallestDenomination(currency.dustSats) + 1.75;
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(true);
    });
    it(`isValidXecSendAmount rejects zero`, () => {
        const testXecSendAmount = 0;
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(false);
    });
    it(`isValidXecSendAmount rejects a non-number string`, () => {
        const testXecSendAmount = 'not a number';
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(false);
    });
    it(`isValidXecSendAmount accepts arbitrary number above dust minimum as a string`, () => {
        const testXecSendAmount = `${
            fromSmallestDenomination(currency.dustSats) + 1.75
        }`;
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(true);
    });
    it(`isValidXecSendAmount rejects null`, () => {
        const testXecSendAmount = null;
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(false);
    });
    it(`isValidXecSendAmount rejects undefined`, () => {
        const testXecSendAmount = undefined;
        expect(isValidXecSendAmount(testXecSendAmount)).toBe(false);
    });
    it(`isValidUtxo returns true for a valid utxo`, () => {
        expect(isValidUtxo(validUtxo)).toBe(true);
    });
    it(`isValidUtxo returns false for missing height`, () => {
        expect(isValidUtxo(invalidUtxoMissingHeight)).toBe(false);
    });
    it(`isValidUtxo returns false for undefined tx_hash`, () => {
        expect(isValidUtxo(invalidUtxoTxidUndefined)).toBe(false);
    });
    it(`isValidUtxo returns false for null`, () => {
        expect(isValidUtxo(null)).toBe(false);
    });
    it(`isValidUtxo returns false for undefined`, () => {
        expect(isValidUtxo()).toBe(false);
    });
    it(`isValidUtxo returns false for empty object`, () => {
        expect(isValidUtxo({})).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns false for object`, () => {
        expect(isValidBchApiUtxoObject({})).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns false for empty array`, () => {
        expect(isValidBchApiUtxoObject([])).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns false for null`, () => {
        expect(isValidBchApiUtxoObject(null)).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns false for undefined`, () => {
        expect(isValidBchApiUtxoObject(undefined)).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns false for hydratedUtxoDetails type object`, () => {
        expect(
            isValidBchApiUtxoObject(
                hydratedUtxoDetailsAfterRemovingConsumedUtxos,
            ),
        ).toBe(false);
    });
    it(`isValidBchApiUtxoObject returns true for hydratedUtxoDetails.slpUtxos`, () => {
        expect(
            isValidBchApiUtxoObject(
                hydratedUtxoDetailsAfterRemovingConsumedUtxos.slpUtxos,
            ),
        ).toBe(true);
    });
    it(`isValidBchApiUtxoObject returns true for valid bch-api utxos object`, () => {
        expect(isValidBchApiUtxoObject(utxosAfterSentTxIncremental)).toBe(true);
    });
});
