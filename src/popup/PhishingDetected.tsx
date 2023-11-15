// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from "react";

interface Props {
  website: string;
}

export const PhishingDetected = ({ website }: Props): JSX.Element => {
  const decodedWebsite = decodeURIComponent(website);

  return (
    <>
      <div className="my-4">
        <span className="text-lg">Phishing detected</span>
      </div>
      <div>
        <p>
          You have been redirected because Reef extension believes that this
          website could compromise the security of your accounts and your
          tokens.
        </p>
        <p className="text-lg">{decodedWebsite}</p>
        <p>
          Note that this website was reported on a community-driven, curated
          list. It might be incomplete or inaccurate. If you think that this
          website was flagged incorrectly,{" "}
          <a href="https://github.com/polkadot-js/phishing/issues/new">
            please open an issue by clicking here
          </a>
          .
        </p>
      </div>
    </>
  );
};
