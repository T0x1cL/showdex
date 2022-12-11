import * as React from 'react';
import Svg from 'react-inlinesvg';
import cx from 'classnames';
import { PiconButton } from '@showdex/components/app';
import { Button, ToggleButton, Tooltip } from '@showdex/components/ui';
import { ShowdexVerifiedTesters } from '@showdex/consts/app';
import { eacute } from '@showdex/consts/core';
import { useUserLadderQuery } from '@showdex/redux/services';
import { useCalcdexSettings, useColorScheme } from '@showdex/redux/store';
import { formatId, openUserPopup } from '@showdex/utils/app';
import { hasNickname } from '@showdex/utils/battle';
import { getResourceUrl } from '@showdex/utils/core';
import type { GenerationNum } from '@smogon/calc';
import type { ElementSizeLabel } from '@showdex/utils/hooks';
import type {
  CalcdexBattleField,
  CalcdexBattleRules,
  CalcdexPlayer,
  CalcdexPlayerKey,
  CalcdexPokemon,
} from '@showdex/redux/store';
import { PokeCalc } from './PokeCalc';
import styles from './PlayerCalc.module.scss';

interface PlayerCalcProps {
  className?: string;
  style?: React.CSSProperties;
  gen?: GenerationNum;
  format?: string;
  rules?: CalcdexBattleRules;
  authPlayerKey?: CalcdexPlayerKey;
  playerKey?: CalcdexPlayerKey;
  player: CalcdexPlayer;
  opponent: CalcdexPlayer;
  field?: CalcdexBattleField;
  defaultName?: string;
  containerSize?: ElementSizeLabel;
  onPokemonChange?: (playerKey: CalcdexPlayerKey, pokemon: DeepPartial<CalcdexPokemon>) => void;
  onIndexSelect?: (index: number) => void;
  onAutoSelectChange?: (autoSelect: boolean) => void;
}

export const PlayerCalc = ({
  className,
  style,
  gen,
  format,
  rules,
  authPlayerKey,
  playerKey = 'p1',
  player,
  opponent,
  field,
  defaultName = '--',
  containerSize,
  onPokemonChange,
  onIndexSelect,
  onAutoSelectChange,
}: PlayerCalcProps): JSX.Element => {
  const settings = useCalcdexSettings();
  const colorScheme = useColorScheme();

  const {
    sideid: playerSideId,
    name,
    rating: ratingFromBattle,
    pokemon,
    // pokemonOrder,
    // activeIndex,
    activeIndices,
    selectionIndex: playerIndex,
    autoSelect,
  } = player || {};

  const playerId = formatId(name);

  // only fetch the rating if the battle didn't provide it to us
  const {
    ladder,
  } = useUserLadderQuery(playerId, {
    skip: !settings?.showPlayerRatings
      || !playerId
      || !format
      || !!ratingFromBattle,

    selectFromResult: ({ data }) => ({
      // map 'gen8unratedrandombattle' (for instance) to 'gen8randombattle'
      ladder: data?.find?.((d) => (
        d?.userid === playerId
          && d.formatid === format.replace('unrated', '')
      )),
    }),
  });

  const rating = ratingFromBattle
    || (!!ladder?.elo && Math.round(parseFloat(ladder.elo)));

  const additionalRatings = {
    gxe: ladder?.gxe ? `${ladder.gxe}%` : null,
    glicko1Rating: ladder?.rpr ? Math.round(parseFloat(ladder.rpr)) : null,
    glicko1Deviation: ladder?.rprd ? Math.round(parseFloat(ladder.rprd)) : null,
  };

  const {
    // sideid: opponentSideId,
    pokemon: opponentPokemons,
    selectionIndex: opponentIndex,
  } = opponent || {};

  // const activePokemon = pokemon[activeIndex];
  const playerPokemon = pokemon[playerIndex];
  const opponentPokemon = opponentPokemons[opponentIndex];

  return (
    <div
      className={cx(
        styles.container,
        !!colorScheme && styles[colorScheme],
        className,
      )}
      style={style}
    >
      <div
        className={cx(
          styles.playerBar,
          containerSize === 'xs' && styles.verySmol,
        )}
      >
        <div className={styles.playerInfo}>
          <Button
            className={cx(
              styles.usernameButton,
              !!name && ShowdexVerifiedTesters.includes(name) && styles.tester,
            )}
            labelClassName={styles.usernameButtonLabel}
            label={name || defaultName}
            tooltip={(
              <div className={styles.tooltipContent}>
                {
                  (!!name && ShowdexVerifiedTesters.includes(name)) &&
                  <>
                    <em>Verified Showdex Tester</em>
                    <br />
                  </>
                }
                Open{' '}
                {name ? (
                  <>
                    <strong>{name}</strong>'s
                  </>
                ) : 'User'}{' '}
                Profile
              </div>
            )}
            tooltipDisabled={!settings?.showUiTooltips}
            hoverScale={1}
            absoluteHover
            disabled={!name}
            onPress={() => openUserPopup(name)}
          >
            {
              (!!name && ShowdexVerifiedTesters.includes(name)) &&
              <Svg
                className={styles.usernameButtonIcon}
                description="Flask Icon"
                src={getResourceUrl('flask.svg')}
              />
            }
          </Button>

          <div className={styles.playerActions}>
            <ToggleButton
              className={styles.toggleButton}
              label="Auto"
              tooltip={`${autoSelect ? 'Manually ' : 'Auto-'}Select Pok${eacute}mon`}
              tooltipDisabled={!settings?.showUiTooltips}
              absoluteHover
              active={autoSelect}
              disabled={!pokemon?.length}
              onPress={() => onAutoSelectChange?.(!autoSelect)}
            />

            {
              (settings?.showPlayerRatings && !!rating) &&
              <Tooltip
                content={(
                  <div className={styles.tooltipContent}>
                    {
                      !!ladder?.formatid &&
                      <div className={styles.ladderFormat}>
                        {ladder.formatid}
                      </div>
                    }

                    <div className={styles.ladderStats}>
                      {
                        !!additionalRatings.gxe &&
                        <>
                          <div className={styles.ladderStatLabel}>
                            GXE
                          </div>
                          <div className={styles.ladderStatValue}>
                            {additionalRatings.gxe}
                          </div>
                        </>
                      }

                      {
                        !!additionalRatings.glicko1Rating &&
                        <>
                          <div className={styles.ladderStatLabel}>
                            Glicko-1
                          </div>
                          <div className={styles.ladderStatValue}>
                            {additionalRatings.glicko1Rating}
                            {
                              !!additionalRatings.glicko1Deviation &&
                              <span style={{ opacity: 0.65 }}>
                                &plusmn;{additionalRatings.glicko1Deviation}
                              </span>
                            }
                          </div>
                        </>
                      }
                    </div>
                  </div>
                )}
                offset={[0, 10]}
                delay={[1000, 50]}
                trigger="mouseenter"
                touch={['hold', 500]}
                disabled={!ladder?.id}
              >
                <div
                  className={cx(
                    styles.rating,
                    !!rating && styles.visible,
                  )}
                >
                  {
                    !!rating &&
                    <>
                      <span className={styles.ratingSeparator}>
                        &bull;
                      </span>

                      {rating} ELO
                    </>
                  }
                </div>
              </Tooltip>
            }
          </div>
        </div>

        <div
          className={styles.teamList}
          style={{
            gridTemplateColumns: `repeat(${['xs', 'sm'].includes(containerSize) ? 6 : 12}, min-content)`,
          }}
        >
          {Array(player?.maxPokemon || 0).fill(null).map((_, i) => {
            const mon = pokemon?.[i];

            const pokemonKey = mon?.calcdexId
              || mon?.ident
              || mon?.searchid
              || mon?.details
              || mon?.name
              || mon?.speciesForme
              || defaultName
              || '???';

            const friendlyPokemonName = mon?.speciesForme
              || mon?.name
              || pokemonKey;

            const nickname = hasNickname(mon) && settings?.showNicknames
              ? mon.name
              : null;

            // const speciesForme = mon?.transformedForme || mon?.speciesForme;
            const speciesForme = mon?.speciesForme; // don't show transformedForme here, as requested by camdawgboi
            const item = mon?.dirtyItem ?? mon?.item;

            const pokemonActive = !!mon?.calcdexId
              // && !!activePokemon?.calcdexId
              // && activePokemon.calcdexId === mon.calcdexId;
              && activeIndices.includes(i);

            const pokemonSelected = !!mon?.calcdexId
              && !!playerPokemon?.calcdexId
              && playerPokemon.calcdexId === mon.calcdexId;

            return (
              <PiconButton
                key={`PlayerCalc:Picon:${playerKey}:${pokemonKey}:${i}`}
                className={cx(
                  styles.piconButton,
                  pokemonActive && styles.active,
                  pokemonSelected && styles.selected,
                  !mon?.hp && styles.fainted,
                )}
                piconClassName={styles.picon}
                display="block"
                aria-label={`Select ${friendlyPokemonName}`}
                pokemon={mon ? {
                  ...mon,
                  speciesForme: speciesForme?.replace(mon?.useMax ? '' : '-Gmax', ''),
                  item,
                } : 'pokeball-none'}
                tooltip={mon ? (
                  <div className={styles.piconTooltip}>
                    {nickname ? (
                      <>
                        {nickname}{' '}
                        (<strong>{friendlyPokemonName}</strong>)
                      </>
                    ) : <strong>{friendlyPokemonName}</strong>}
                    {
                      !!item &&
                      <>
                        <br />
                        {item}
                      </>
                    }
                  </div>
                ) : undefined}
                disabled={!mon?.speciesForme}
                onPress={() => onIndexSelect?.(i)}
              >
                <div className={styles.background} />
              </PiconButton>
            );
          })}
        </div>
      </div>

      <PokeCalc
        className={styles.pokeCalc}
        gen={gen}
        format={format}
        rules={rules}
        authPlayerKey={authPlayerKey}
        playerKey={playerKey}
        playerPokemon={playerPokemon}
        opponentPokemon={opponentPokemon}
        // active={activeIndices?.includes(playerIndex)}
        field={{
          ...field,
          attackerSide: playerSideId === playerKey ? field?.attackerSide : field?.defenderSide,
          defenderSide: playerSideId === playerKey ? field?.defenderSide : field?.attackerSide,
        }}
        containerSize={containerSize}
        onPokemonChange={(p) => onPokemonChange?.(playerKey, p)}
      />
    </div>
  );
};
