jest.dontMock('../src/app/stores/Persist');
jest.dontMock('../src/app/components/TranslatedComponent');
jest.dontMock('../src/app/components/ModalImport');

import React from 'react';
import ReactDOM from 'react-dom';
import TU from 'react-testutils-additions';
import Utils from './testUtils';
import { getLanguage } from '../src/app/i18n/Language';

describe('Import Modal', function() {

  let MockRouter = require('../src/app/Router').default;
  const Persist = require('../src/app/stores/Persist').default;
  const ModalImport = require('../src/app/components/ModalImport').default;
  const mockContext = {
    language: getLanguage('en'),
    sizeRatio: 1,
    openMenu: jest.genMockFunction(),
    closeMenu: jest.genMockFunction(),
    showModal: jest.genMockFunction(),
    hideModal: jest.genMockFunction(),
    tooltip: jest.genMockFunction(),
    termtip: jest.genMockFunction(),
    onWindowResize: jest.genMockFunction()
  };

  let modal, render, ContextProvider = Utils.createContextProvider(mockContext);

  /**
   * Clear saved builds, and reset React DOM
   */
  function reset() {
    MockRouter.go.mockClear();
    Persist.deleteAll();
    render = TU.renderIntoDocument(<ContextProvider><ModalImport /></ContextProvider>);
    modal = TU.findRenderedComponentWithType(render, ModalImport);
  }

  /**
   * Simulate user import text entry / paste
   * @param  {string} text Import text / raw data
   */
  function pasteText(text) {
    let textarea = TU.findRenderedDOMComponentWithTag(render, 'textarea');
    TU.Simulate.change(textarea, { target: { value: text } });
  }

  /**
   * Simulate click on Proceed button
   */
  function clickProceed() {
    let proceedButton = TU.findRenderedDOMComponentWithId(render, 'proceed');
    TU.Simulate.click(proceedButton);
  }

  /**
   * Simulate click on Import button
   */
  function clickImport() {
    let importButton = TU.findRenderedDOMComponentWithId(render, 'import');
    TU.Simulate.click(importButton);
  }

  describe('Import Backup', function() {

    beforeEach(reset);

    it('imports a valid backup', function() {
      let importData = require('./fixtures/valid-backup');
      let importString = JSON.stringify(importData);

      expect(modal.state.importValid).toEqual(false);
      expect(modal.state.errorMsg).toEqual(null);
      pasteText(importString);
      expect(modal.state.importValid).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.builds).toEqual(importData.builds);
      expect(modal.state.comparisons).toEqual(importData.comparisons);
      expect(modal.state.shipDiscount).toEqual(importData.discounts[0]);
      expect(modal.state.moduleDiscount).toEqual(importData.discounts[1]);
      expect(modal.state.insurance).toBe(importData.insurance.toLowerCase());
      clickProceed();
      expect(modal.state.processed).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickImport();
      expect(Persist.getBuilds()).toEqual(importData.builds);
      expect(Persist.getComparisons()).toEqual(importData.comparisons);
      expect(Persist.getInsurance()).toEqual(importData.insurance.toLowerCase());
      expect(Persist.getShipDiscount()).toEqual(importData.discounts[0]);
      expect(Persist.getModuleDiscount()).toEqual(importData.discounts[1]);
    });

    it('imports an old valid backup', function() {
      const importData = require('./fixtures/old-valid-export');
      const importStr = JSON.stringify(importData);

      pasteText(importStr);
      expect(modal.state.builds).toEqual(importData.builds);
      expect(modal.state.importValid).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickProceed();
      expect(modal.state.processed).toBeTruthy();
      clickImport();
      expect(Persist.getBuilds()).toEqual(importData.builds);
    });

    it('catches an invalid backup', function() {
      const importData = require('./fixtures/valid-backup');
      let invalidImportData = Object.assign({}, importData);
      //invalidImportData.builds.asp = null;   // Remove Asp Miner build used in comparison
      delete(invalidImportData.builds.asp);

      pasteText('"this is not valid"');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Must be an object or array!');
      pasteText('{ "builds": "Should not be a string" }');
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('builds must be an object!');
      pasteText(JSON.stringify(importData).replace('anaconda', 'invalid_ship'));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('"invalid_ship" is not a valid Ship Id!');
      pasteText(JSON.stringify(importData).replace('Dream', ''));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Imperial Clipper build "" must be a string at least 1 character long!');
      pasteText(JSON.stringify(invalidImportData));
      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('asp build "Miner" data is missing!');
    });
  });

  describe('Import Detailed V3 Build', function() {

    beforeEach(reset);

    it('imports a valid v3 build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v3');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04--0303326b.AwRj4zNKqA%3D%3D.CwBhCYzBGW9qCTSqs5xA.&bn=Test%20My%20Ship');
    });

    it('catches an invalid build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v3');
      pasteText(JSON.stringify(importData).replace('components', 'comps'));

      expect(modal.state.importValid).toBeFalsy();
      expect(modal.state.errorMsg).toEqual('Anaconda Build "Test My Ship": Invalid data');
    });
  });

  describe('Import Detailed V4 Build', function() {

    beforeEach(reset);

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/anaconda-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/anaconda?code=4putkFklkdzsuf52c0o0o0o1m1m0q0q0404-0l0b0100034k5n052d04--0303326b.AwRj4zNKqA%3D%3D.CwBhCYzBGW9qCTSqs5xA.H4sIAAAAAAAAA2P8xwAEf0GE2AtmBob%2F%2FwFvM%2BjKEgAAAA%3D%3D&bn=Test%20My%20Ship');
    });
  });

  describe('Import Detailed Engineered V4 Build', function() {

    beforeEach(reset);

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/asp-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/asp?code=0pftiFflfddsnf5------020202033c044002v62f2i.AwRj4yvI.CwRgDBldHnJA.H4sIAAAAAAAAA2P858DAwPCXEUhwHPvx%2F78YG5AltB7I%2F8%2F0TwImJboDSPJ%2F%2B%2Ff%2Fv%2FKlX%2F%2F%2Fi3AwMTBIfARK%2FGf%2BJwVSxArStVAYqOjvz%2F%2F%2FJVo5GRhE2IBc4SKQSSz%2FDGEmCa398P8%2F%2F2%2BgTf%2F%2FAwDFxwtofAAAAA%3D%3D&bn=Multi-purpose%20Asp%20Explorer');
    });

    it('imports a valid v4 build with modifications', function() {
      const importData = require('./fixtures/courier-test-detailed-export-v4');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/imperial_courier?code=0patzF5l0das8f31a1a270202000e402t0101-2f.AwRj4zKA.CwRgDBldLiQ%3D.H4sIAAAAAAAAA12OP0tCYRjFj9fuVbvF1du9ekkT8s%2FkIg4NElyIBBd321yaGvwUQTS3N7UFfYygIT9EoyQUJA36ns47XJCWA%2B%2Fz%2Bz3Pe3ImBbDNKaqNPSBoGrL4ngfomKpFGiJ%2BLgHteR1IPjxJT5pF11uSeXNsJVcRfgdC92syWUuK0iMdKZqrjJ%2F0aoA71lJ5oKf38knWcCiptCPdhJIerdS00vlK0qktlqoj983UmqqHjQ33VsW8eazFmaTyULP2hQ4lX8LBme6g%2F6v0TTdbxJ2KhdEIaCw15MF%2FNB0L%2BS2hwEwyFM8KgP%2BqEpWWA3Qu9Z3z9kPWHzakt7Dt%2BAeD7ghSTgEAAA%3D%3D&bn=Multi-purpose%20Imperial%20Courier');
    });
  });

  describe('Import Detaild Builds Array', function() {

    beforeEach(reset);

    it('imports all builds', function() {
      const importData = require('./fixtures/valid-detailed-export');
      const expectedBuilds = require('./fixtures/expected-builds');

      pasteText(JSON.stringify(importData));
      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      clickProceed();
      expect(modal.state.processed).toBeTruthy();
      clickImport();

      let builds = Persist.getBuilds();

      for (let s in builds) {
        for (let b in builds[s]) {
          expect(builds[s][b]).toEqual(expectedBuilds[s][b]);
        }
      }
    });
  });

  describe('Import Companion API Build', function() {

    beforeEach(reset);

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/companion-api-import-1');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/federal_corvette?code=2putsFklndzsxf50x0x7l28281919040404040402020l06p05sf63c5ifrv66g2f.AwRj4zNaKA%3D%3D.CwRgDBldUExuBiQqA%3D%3D%3D.H4sIAAAAAAAAA02Svy9DURTHT1vvtfoat30eXlvV0ufXQmLAIDHSRDcJAzHV1PgDDAaJpVbxF0gYKhFiEFuXTgbCIsKfYJCItHWP75E83vLNue%2F7Od977zs3pBeJ6DsE6TcNIlVn5lgFSw7rfrEikL6mSVS0HSL3MgxoqM3sTGtm%2BxA2R3RGSLSTfWzD32kxu043kVNFDxt6wU8ajVpEY7coh5uARrYR0n3aYY4%2FY6lmkc4xveafqZOHpHejRMb9J7NZQqN9Ascto4fjet0P7iQgRhV7mo5LlLtAUnIe34rVDaKBF9AThUJhla3%2FHqMRB76XBV7v8vEvOOoGx%2BJEgKz9BgvZEHJOyHNUakYujUuSW8KxWOkl%2F%2BzuMsR6QpkS8URUTYKTAagNta4EEvFE1INAqQD0IdCdQCKeiOoBk9%2BPYU87QL7i2tajkITKk0odSFxvAJrClawX%2BCkRT0RZYNjV5b%2BRbyLaOpMkafJa%2BBgufjFnjxBnvgFxKvgBnNYlP7jwiXcRnYQ%2F%2FoRlqCnTHAz41xha9F78CNahGXk8eZ3z%2FcyWjJcg7goeU%2BJdZsw%2FFW2pAaMCAAA%3D&bn=Imported%20Federal%20Corvette');
    });

    it('imports a valid v4 build', function() {
      const importData = require('./fixtures/companion-api-import-2');
      pasteText(JSON.stringify(importData));

      expect(modal.state.importValid).toBeTruthy();
      expect(modal.state.errorMsg).toEqual(null);
      expect(modal.state.singleBuild).toBe(true);
      clickProceed();
      expect(MockRouter.go.mock.calls.length).toBe(1);
      expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/beluga?code=0pktsFplCdpsnf70t0t2727270004040404043c4fmimlmm04mc0iv62i2f.AwRj4yukg%3D%3D%3D.CwRgDBldHi8IUA%3D%3D.H4sIAAAAAAAAA2P8Z8%2FAwPCXEUiIKTMxMPCv%2F%2Ff%2FP8cFIPGf6Z8YTEr0GjMDg%2FJWICERBOTzn%2Fn7%2F7%2FIO5Ai5n9SIEWsQEIoSxAolfbt%2F3%2BJPk4GBhE7YQYGYVmgcuVnf4Aq%2FwMAIrEcGGsAAAA%3D&bn=Imported%20Beluga%20Liner');
    });
  });

  describe('Import E:D Shipyard Builds', function() {

//    it('imports a valid build', function() {
//      const imports = require('./fixtures/ed-shipyard-import-valid');
//
//      for (let i = 0; i < imports.length; i++ ) {
//        reset();
//        let fixture = imports[i];
//        pasteText(fixture.buildText);
//        expect(modal.state.importValid).toBeTruthy();
//        expect(modal.state.errorMsg).toEqual(null);
//        clickProceed();
//        expect(MockRouter.go.mock.calls.length).toBe(1);
//        expect(MockRouter.go.mock.calls[0][0]).toBe('/outfit/' + fixture.shipId + '?code=' + encodeURIComponent(fixture.buildCode) + '&bn=' + encodeURIComponent(fixture.buildName));
//      }
//    });

    it('catches invalid builds', function() {
      const imports = require('./fixtures/ed-shipyard-import-invalid');

      for (let i = 0; i < imports.length; i++ ) {
        reset();
        pasteText(imports[i].buildText);
        expect(modal.state.importValid).toBeFalsy();
        expect(modal.state.errorMsg).toEqual(imports[i].errorMsg);
      }
    });
  });

  describe('Imports from a Comparison', function() {

    it('imports a valid comparison', function() {
      const importBuilds = require('./fixtures/valid-backup').builds;
      Persist.deleteAll();
      render = TU.renderIntoDocument(<ContextProvider><ModalImport builds={importBuilds} /></ContextProvider>);
      modal = TU.findRenderedComponentWithType(render, ModalImport);

      expect(modal.state.processed).toBe(true);
      expect(modal.state.errorMsg).toEqual(null);
      clickImport();
      expect(Persist.getBuilds()).toEqual(importBuilds);
    });
  });

});
